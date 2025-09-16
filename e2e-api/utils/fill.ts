import * as sdk from "@across-protocol/sdk";
import { Address, Hex, parseEventLogs } from "viem";

import { e2eConfig, getSpokePoolAddress } from "./config";
import { setAllowance } from "./token";
import { SpokePoolAbi } from "./abis";

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

  const spokeAddress = getSpokePoolAddress(destinationChainId);

  const a = depositEvent.args;

  const approveReceipt = await setAllowance({
    chainId: destinationChainId,
    tokenAddress: sdk.utils
      .toAddressType(a.outputToken, destinationChainId)
      .toNative() as Address,
    account: relayer.address,
    spender: sdk.utils
      .toAddressType(spokeAddress, destinationChainId)
      .toNative() as Address,
    amount: BigInt(a.outputAmount.toString()),
    wallet: relayer,
  });

  const fillTxHash = await destinationClient.writeContract({
    address: spokeAddress as Address,
    abi: SpokePoolAbi,
    functionName: "fillRelay",
    args: [
      {
        depositor: a.depositor,
        recipient: a.recipient,
        exclusiveRelayer: a.exclusiveRelayer,
        inputToken: a.inputToken,
        outputToken: a.outputToken,
        inputAmount: a.inputAmount,
        outputAmount: a.outputAmount,
        originChainId: BigInt(originChainId),
        depositId: a.depositId,
        fillDeadline: a.fillDeadline,
        exclusivityDeadline: a.exclusivityDeadline,
        message: a.message,
      },
      BigInt(repaymentChainId),
      repaymentAddressBytes32 as Hex,
    ],
    account: relayer,
  });
  const fillReceipt = await destinationClient.waitForTransactionReceipt({
    hash: fillTxHash,
  });

  const fillEvents = parseEventLogs({
    eventName: "FilledRelay",
    abi: SpokePoolAbi,
    logs: fillReceipt.logs,
  });

  if (!fillEvents || fillEvents.length === 0) {
    throw new Error("No fill event found");
  }

  if (fillEvents.length > 1) {
    throw new Error("Multiple fill events found");
  }

  return {
    destinationChainId,
    fillReceipt,
    approveReceipt,
    fillEvent: fillEvents[0],
  };
}
