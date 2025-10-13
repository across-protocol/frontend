import * as sdk from "@across-protocol/sdk";
import {
  Address,
  encodeFunctionData,
  Hex,
  parseAbi,
  parseEventLogs,
  zeroAddress,
  maxUint256,
} from "viem";

import { e2eConfig, getSpokePoolAddress } from "./config";
import { getBalance, setAllowance } from "./token";
import { SpokePoolAbi } from "./abis";
import { handleTevmError } from "./tevm";

import type { SubmittedTxReceipts } from "./deposit";

export type ExecuteFillParams = {
  depositEvent: SubmittedTxReceipts["depositEvent"];
  originChainId: number;
  relayer: string;
  repaymentChainId?: number;
  repaymentAddress?: string;
};

export async function executeFill(
  params: ExecuteFillParams,
  destinationChainClient: ReturnType<typeof e2eConfig.getClient>
) {
  const { depositEvent, originChainId, relayer } = params;
  const destinationChainId = Number(depositEvent.args.destinationChainId);

  const repaymentChainId = params.repaymentChainId ?? destinationChainId;
  const repaymentAddressBytes32 = sdk.utils
    .toAddressType(params.repaymentAddress ?? relayer, repaymentChainId)
    .toBytes32();

  const _spokeAddress = getSpokePoolAddress(destinationChainId);
  const {
    outputToken: _outputToken,
    outputAmount,
    exclusiveRelayer: _exclusiveRelayer,
    depositor: _depositor,
    recipient: _recipient,
    inputToken: _inputToken,
    inputAmount,
    depositId,
    fillDeadline,
    exclusivityDeadline,
    message,
  } = depositEvent.args;
  const depositor = sdk.utils.toAddressType(_depositor, originChainId);
  const recipient = sdk.utils.toAddressType(_recipient, destinationChainId);
  const inputToken = sdk.utils.toAddressType(_inputToken, originChainId);
  const outputToken = sdk.utils.toAddressType(_outputToken, destinationChainId);
  const spokeAddress = sdk.utils.toAddressType(
    _spokeAddress,
    destinationChainId
  );
  const exclusiveRelayer = sdk.utils.toAddressType(
    _exclusiveRelayer,
    destinationChainId
  );
  const relayerAddressToUse =
    zeroAddress === exclusiveRelayer.toEvmAddress()
      ? (relayer as Address)
      : (exclusiveRelayer.toEvmAddress() as Address);

  // Set bridging funds for relayer
  await destinationChainClient.tevmDeal({
    erc20: outputToken.toEvmAddress() as Address,
    account: relayerAddressToUse,
    amount: outputAmount * 100n,
  });
  await destinationChainClient.tevmMine({ blockCount: 5 });

  // Approve destination SpokePool
  await setAllowance({
    tokenAddress: outputToken.toEvmAddress() as Address,
    account: relayerAddressToUse,
    spender: spokeAddress.toEvmAddress() as Address,
    amount: maxUint256,
    from: relayerAddressToUse,
    client: destinationChainClient,
  });

  const relayerBalance = await getBalance(
    outputToken.toEvmAddress() as Address,
    relayerAddressToUse,
    destinationChainClient
  );
  console.log("Relayer balance before fill:", relayerBalance);
  console.log("Relayer address:", relayerAddressToUse);

  // DIAGNOSTIC: Check allowance right before fill
  const allowance = await destinationChainClient.readContract({
    address: outputToken.toEvmAddress() as Address,
    abi: parseAbi([
      "function allowance(address, address) view returns (uint256)",
    ]),
    functionName: "allowance",
    args: [relayerAddressToUse, spokeAddress.toEvmAddress() as Address],
  });
  console.log(`Allowance for SpokePool before fill: ${allowance}`);

  // Mitigate race condition
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Fill relay
  const fillCallResult = await destinationChainClient.tevmCall({
    from: relayerAddressToUse,
    to: spokeAddress.toEvmAddress() as Address,
    addToBlockchain: true,
    data: encodeFunctionData({
      abi: SpokePoolAbi,
      functionName: "fillRelay",
      args: [
        {
          depositor: depositor.toBytes32() as Hex,
          recipient: recipient.toBytes32() as Hex,
          exclusiveRelayer: exclusiveRelayer.toBytes32() as Hex,
          inputToken: inputToken.toBytes32() as Hex,
          outputToken: outputToken.toBytes32() as Hex,
          inputAmount,
          outputAmount,
          originChainId: BigInt(originChainId),
          depositId,
          fillDeadline,
          exclusivityDeadline,
          message,
        },
        BigInt(repaymentChainId),
        repaymentAddressBytes32 as Hex,
      ],
    }),
    onAfterMessage: handleTevmError,
  });

  await destinationChainClient.tevmMine({ blockCount: 5 });

  if (!fillCallResult.txHash) {
    throw new Error("Fill call failed");
  }

  const fillReceipt = await destinationChainClient.waitForTransactionReceipt({
    hash: fillCallResult.txHash,
  });

  const fillEvents = parseEventLogs({
    eventName: "FilledRelay",
    abi: SpokePoolAbi,
    logs: fillReceipt.logs,
  });

  if (!fillEvents || fillEvents.length === 0) {
    throw new Error("No fill event found");
  }

  return { fillReceipt, fillEvents: fillEvents[0] };
}
