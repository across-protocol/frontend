import { assert } from "superstruct";
import { utils } from "ethers";

import { GaslessSubmitBody, GaslessSubmitBodySchema } from "./_validation";
import { getSpokePoolPeripheryAddress } from "../../_spoke-pool-periphery";
import { ForbiddenError, InvalidParamError } from "../../_errors";
import { publishGaslessDepositMessage } from "./_publish-pubsub";
import { Permission } from "../../_api-keys";
import { getTokenInfo } from "../../_utils";
import { getSponsoredGaslessRoute } from "../../_sponsored-gasless-config";

export type GaslessSubmitResponse = {
  depositId: string;
  messageId: string;
};

export async function handleGaslessSubmit(params: {
  body: GaslessSubmitBody;
  requestId: string;
  apiKeyName?: string;
  apiKeyPermissions?: Permission[];
}): Promise<GaslessSubmitResponse> {
  const { body, requestId, apiKeyName, apiKeyPermissions } = params;

  // Validate request body structure
  assert(body, GaslessSubmitBodySchema);

  const swapTx = body.swapTx;
  const signature = body.signature;
  const chainId = swapTx.chainId;
  const targetAddress = swapTx.to as string;
  const depositId = swapTx.data.depositId;

  // Verify swapTx.to is a valid SpokePoolPeriphery for the given chainId
  const peripheryAddress = getSpokePoolPeripheryAddress(chainId, false) as
    | string
    | undefined;
  if (
    !peripheryAddress ||
    peripheryAddress.toLowerCase() !== targetAddress.toLowerCase()
  ) {
    throw new InvalidParamError({
      message: `Invalid target address. Expected SpokePoolPeriphery at ${
        peripheryAddress
      } for chain ${chainId}, got ${targetAddress}`,
      param: "swapTx.to",
    });
  }

  // Verify signature matches permit.message.from
  const permit = swapTx.data.permit;

  let recoveredSigner: string;
  try {
    recoveredSigner = utils.verifyTypedData(
      permit.domain,
      permit.types,
      permit.message,
      signature
    );
  } catch {
    throw new InvalidParamError({
      message: "Invalid signature: unable to recover signer",
      param: "signature",
    });
  }

  if (recoveredSigner.toLowerCase() !== permit.message.from.toLowerCase()) {
    throw new InvalidParamError({
      message: `Signature mismatch. Expected ${permit.message.from}, got ${recoveredSigner}`,
      param: "signature",
    });
  }

  // Verify permit.message.from matches depositor
  const witness = swapTx.data.witness;

  const depositor =
    witness.type === "BridgeWitness"
      ? witness.data.baseDepositData.depositor
      : witness.data.depositData.depositor;

  if (permit.message.from.toLowerCase() !== depositor.toLowerCase()) {
    throw new InvalidParamError({
      message: `permit.message.from must match depositor`,
      param: "swapTx.data.permit.message.from",
    });
  }

  // Is sponsored gasless route eligible?
  const witnessData =
    witness.type === "BridgeWitness"
      ? witness.data.baseDepositData
      : witness.data.depositData;
  const [inputToken, outputToken] = await Promise.all([
    getTokenInfo({
      chainId,
      address: witnessData.inputToken,
    }),
    getTokenInfo({
      chainId: Number(witnessData.destinationChainId),
      address: witnessData.outputToken,
    }),
  ]);
  const sponsoredGaslessRoute = getSponsoredGaslessRoute({
    apiKeyName,
    apiKeyPermissions,
    originChainId: chainId,
    destinationChainId: Number(witnessData.destinationChainId),
    inputTokenSymbol: inputToken.symbol,
    outputTokenSymbol: outputToken.symbol,
    permitType: swapTx.data.type,
  });
  if (!sponsoredGaslessRoute) {
    throw new ForbiddenError({
      message: "Sponsored gasless route not eligible for this API key",
    });
  }

  // Publish to Pub/Sub
  const messageId = await publishGaslessDepositMessage({
    swapTx,
    signature,
    submittedAt: new Date().toISOString(),
    requestId,
  });

  return {
    depositId,
    messageId,
  };
}
