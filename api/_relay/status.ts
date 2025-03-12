import { VercelResponse } from "@vercel/node";
import { assert, type, Infer } from "superstruct";

import { handleErrorCondition, InputError } from "../_errors";
import { getLogger, hexString } from "../_utils";
import { getCachedRelayRequest } from "./_utils";
import { TypedVercelRequest } from "../_types";

const RelayRequestStatusSchema = type({
  requestHash: hexString(),
});

type RelayRequestStatusType = Infer<typeof RelayRequestStatusSchema>;

export default async function handler(
  request: TypedVercelRequest<RelayRequestStatusType>,
  response: VercelResponse
) {
  const logger = getLogger();
  logger.debug({
    at: "Relay/status",
    message: "Request params",
    params: request.query,
  });

  try {
    assert(request.query, RelayRequestStatusSchema);

    const cachedRelayRequest = await getCachedRelayRequest(
      request.query.requestHash
    );

    if (cachedRelayRequest.status === "unknown") {
      throw new InputError({
        message: `Request with hash ${request.query.requestHash} is unknown`,
        code: "INVALID_PARAM",
        param: "requestHash",
      });
    }

    response.status(200).json(cachedRelayRequest);
  } catch (error) {
    return handleErrorCondition("api/relay/status", response, logger, error);
  }
}
