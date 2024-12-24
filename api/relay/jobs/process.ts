import { VercelRequest, VercelResponse } from "@vercel/node";
import { assert, enums, type, string } from "superstruct";
import { Receiver } from "@upstash/qstash";

import { handleErrorCondition } from "../../_errors";
import { getLogger } from "../../_utils";
import {
  validateMethodArgs,
  verifySignatures,
  setCachedRelayRequestSuccess,
  setCachedRelayRequestFailure,
} from "../_utils";
import { RelayRequest } from "../_types";
import { strategiesByName } from "../_strategies";
import { BaseRelayRequestBodySchema } from "../index";

const messageReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

const RelayProcessJobBodySchema = type({
  strategyName: enums(Object.keys(strategiesByName)),
  requestId: string(),
  request: BaseRelayRequestBodySchema,
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
      body: req.body,
    });

    if (!isValid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    assert(req.body, RelayProcessJobBodySchema);
    const { request, strategyName, requestId } = req.body;

    // Validate method-specific request body
    const methodNameAndArgs = validateMethodArgs(
      request.methodName,
      request.argsWithoutSignatures
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

    // Handle request via strategy
    try {
      const txHash = await strategy.relay(relayRequest);
      // Store requestId in database
      await setCachedRelayRequestSuccess({
        requestId,
        request: relayRequest,
        txHash,
      });
      res.status(200).json({
        requestId,
        txHash,
      });
    } catch (error) {
      await setCachedRelayRequestFailure({
        requestId,
        request: relayRequest,
        error: error as Error,
      });
      res.status(500).json({
        requestId,
        error: error as Error,
      });
    }
  } catch (error) {
    return handleErrorCondition("api/relay", res, logger, error);
  }
}
