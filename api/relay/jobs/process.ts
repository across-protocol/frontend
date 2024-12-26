import { VercelRequest, VercelResponse } from "@vercel/node";
import { assert, enums, number, object, type } from "superstruct";
import { Receiver } from "@upstash/qstash";

import { handleErrorCondition, InvalidParamError } from "../../_errors";
import { getLogger, hexString, validAddress } from "../../_utils";
import {
  validateMethodArgs,
  verifySignatures,
  setCachedRelayRequestSuccess,
  setCachedRelayRequestFailure,
  getCachedRelayRequest,
  allowedMethodNames,
} from "../_utils";
import { RelayRequest } from "../_types";
import { strategiesByName } from "../_strategies";

const messageReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

const RelayProcessJobBodySchema = type({
  strategyName: enums(Object.keys(strategiesByName)),
  request: type({
    chainId: number(),
    to: validAddress(),
    methodNameAndArgs: type({
      methodName: enums(allowedMethodNames),
      args: object(),
    }),
    signatures: object({
      permit: hexString(),
      deposit: hexString(),
    }),
  }),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = getLogger();
  logger.debug({
    at: "Relay/jobs/process",
    message: "Request body",
    body: req.body,
  });

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Verify message comes from QSTASH
    const isValid = await messageReceiver.verify({
      signature: (req.headers["upstash-signature"] ||
        req.headers["Upstash-Signature"]) as string,
      body: JSON.stringify(req.body),
    });

    if (!isValid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    assert(req.body, RelayProcessJobBodySchema);
    const { request, strategyName } = req.body;

    // Validate method-specific request body
    const methodNameAndArgs = validateMethodArgs(
      request.methodNameAndArgs.methodName,
      request.methodNameAndArgs.args
    );

    // Verify user signatures
    const { signatures, chainId, to } = request;
    await verifySignatures({
      methodNameAndArgs,
      signatures,
      chainId,
      to,
    });

    const strategy = strategiesByName[strategyName];
    const relayRequest: RelayRequest = {
      chainId,
      to,
      methodNameAndArgs,
      signatures,
    };

    // Get cached request
    const cachedRequest = await getCachedRelayRequest(relayRequest);

    if (
      !cachedRequest ||
      cachedRequest.status === "unknown" ||
      cachedRequest.status === "success"
    ) {
      throw new InvalidParamError({
        param: "request",
        message: "Request not found in cache or is not pending",
      });
    }

    const { messageId } = cachedRequest;

    // Handle request via strategy
    try {
      const txHash = await strategy.relay(relayRequest);
      // Store requestId in database
      await setCachedRelayRequestSuccess({
        request: relayRequest,
        txHash,
      });
      return res.status(200).json({
        messageId,
        txHash,
      });
    } catch (error) {
      await setCachedRelayRequestFailure({
        request: relayRequest,
        error: error as Error,
      });
      throw error;
    }
  } catch (error) {
    return handleErrorCondition("api/relay", res, logger, error);
  }
}
