import { VercelRequest, VercelResponse } from "@vercel/node";
import { object, number, assert, enums } from "superstruct";

import { handleErrorCondition } from "../_errors";
import { getLogger, hexString, validAddress } from "../_utils";
import {
  allowedMethodNames,
  validateMethodArgs,
  verifySignatures,
} from "./_utils";

const BaseRelayRequestBodySchema = object({
  chainId: number(),
  to: validAddress(),
  methodName: enums(allowedMethodNames),
  argsWithoutSignatures: object(),
  signatures: object({
    permit: hexString(),
    deposit: hexString(),
  }),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const logger = getLogger();
  logger.debug({
    at: "Relay",
    message: "Request body",
    body: request.body,
  });

  try {
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method not allowed" });
    }

    assert(request.body, BaseRelayRequestBodySchema);

    // Validate method-specific request body
    const methodNameAndArgs = validateMethodArgs(
      request.body.methodName,
      request.body.argsWithoutSignatures
    );

    // Verify signatures
    const { signatures } = request.body;
    await verifySignatures({
      methodNameAndArgs,
      signatures,
      originChainId: request.body.chainId,
      entryPointContractAddress: request.body.to,
    });

    // TODO: Execute transaction based on configured strategies

    return response.status(200).json({
      success: true,
      // Add relevant response data
    });
  } catch (error) {
    return handleErrorCondition("api/relay", response, logger, error);
  }
}
