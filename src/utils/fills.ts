import { Signature } from "@solana/kit";
import { getSVMRpc } from "./providers";
import { SvmCpiEventsClient } from "./sdk";
import { FillMetadata } from "views/DepositStatus/hooks/useDepositTracking/types";

// ====================================================== //
// ========================= SVM ======================== //
// ====================================================== //

// get FilledRelay event from SVM Spoke by transaction signature
export async function getFillTxBySignature({
  signature,
  chainId,
}: {
  signature: Signature;
  chainId: number;
}): Promise<FillMetadata | undefined> {
  const rpc = getSVMRpc(chainId);
  const eventsClient = await SvmCpiEventsClient.create(rpc);
  const fillTx = await eventsClient.getFillEventsFromSignature(
    chainId,
    signature
  );

  const data = fillTx?.[0];

  return {
    fillTxHash: signature,
    fillTxTimestamp: Number(data?.fillTimestamp),
    outputAmount: data?.outputAmount,
  };
}
