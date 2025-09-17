import * as sdk from "@across-protocol/sdk";
import {
  Address,
  encodeFunctionData,
  Hex,
  parseEventLogs,
  zeroAddress,
} from "viem";

import { e2eConfig, getSpokePoolAddress } from "./config";
import { setAllowance } from "./token";
import { SpokePoolAbi } from "./abis";
import { handleTevmError } from "./tevm";

import type { SubmittedTxReceipts } from "./deposit";

export type ExecuteFillParams = {
  depositEvent: SubmittedTxReceipts["depositEvent"];
  originChainId: number;
  repaymentChainId?: number;
  repaymentAddress?: string;
};

export async function executeFill(params: ExecuteFillParams) {
  const { depositEvent, originChainId } = params;
  const destinationChainId = Number(depositEvent.args.destinationChainId);
  const destinationClient = e2eConfig.getClient(destinationChainId);
  const relayer = e2eConfig.getAccount("relayer");

  const repaymentChainId = params.repaymentChainId ?? destinationChainId;
  const repaymentAddressBytes32 = sdk.utils
    .toAddressType(params.repaymentAddress ?? relayer.address, repaymentChainId)
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
  const isExclusiveRelayer = zeroAddress !== exclusiveRelayer.toEvmAddress();

  if (!isExclusiveRelayer) {
    // Set bridging funds for relayer
    await destinationClient.tevmDeal({
      erc20: outputToken.toEvmAddress() as Address,
      account: e2eConfig.addresses.relayer,
      amount: outputAmount,
    });
    await destinationClient.tevmMine({ blockCount: 1 });
    // Approve destination SpokePool
    await setAllowance({
      chainId: destinationChainId,
      tokenAddress: outputToken.toEvmAddress() as Address,
      account: relayer.address,
      spender: spokeAddress.toEvmAddress() as Address,
      amount: BigInt(outputAmount.toString()),
      wallet: relayer,
    });
  }

  // Fill relay
  const fillCallResult = await destinationClient.tevmCall({
    from: isExclusiveRelayer
      ? (exclusiveRelayer.toEvmAddress() as Address)
      : relayer.address,
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

  await destinationClient.tevmMine({ blockCount: 1 });

  if (!fillCallResult.txHash) {
    throw new Error("Fill call failed");
  }

  const fillReceipt = await destinationClient.waitForTransactionReceipt({
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
