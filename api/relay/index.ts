import { VercelRequest, VercelResponse } from "@vercel/node";
import { object, number, assert, enums } from "superstruct";

import { handleErrorCondition } from "../_errors";
import { getLogger, hexString, validAddress } from "../_utils";
import {
  allowedMethodNames,
  setCachedRelayRequestPending,
  validateMethodArgs,
  verifySignatures,
} from "./_utils";
import { getGelatoStrategy } from "./_strategies/gelato";
import { CHAIN_IDs } from "../_constants";
import { pushRelayRequestToQueue } from "./_queue";
import { RelayRequest } from "./_types";

export const BaseRelayRequestBodySchema = object({
  chainId: number(),
  to: validAddress(),
  methodName: enums(allowedMethodNames),
  argsWithoutSignatures: object(),
  signatures: object({
    permit: hexString(),
    deposit: hexString(),
  }),
});

const strategies = {
  default: getGelatoStrategy(),
  [CHAIN_IDs.MAINNET]: getGelatoStrategy(),
};

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
    const { signatures, chainId, to } = request.body;
    await verifySignatures({
      methodNameAndArgs,
      signatures,
      chainId,
      to,
    });

    // Push request to queue
    const strategy = strategies[chainId] ?? strategies.default;
    const relayRequest: RelayRequest = {
      chainId,
      to,
      methodNameAndArgs,
      signatures,
    };
    const queueResponse = await pushRelayRequestToQueue({
      request: relayRequest,
      strategy,
    });

    // Store requestId in database
    await setCachedRelayRequestPending({
      messageId: queueResponse.messageId,
      request: relayRequest,
    });

    response.status(200).json({
      messageId: queueResponse.messageId,
    });
  } catch (error) {
    return handleErrorCondition("api/relay", response, logger, error);
  }
}
