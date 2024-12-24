import { VercelResponse } from "@vercel/node";
import { assert, type, string, Infer } from "superstruct";

import { handleErrorCondition } from "../_errors";
import { getLogger } from "../_utils";
import { getCachedRelayRequest } from "./_utils";
import { TypedVercelRequest } from "../_types";

const RelayRequestStatusSchema = type({
  requestId: string(),
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
      request.query.requestId
    );

    response.status(200).json(cachedRelayRequest);
  } catch (error) {
    return handleErrorCondition("api/relay/status", response, logger, error);
  }
}
