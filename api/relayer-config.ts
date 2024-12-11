import { VercelResponse } from "@vercel/node";
import {
  getRelayerFromSignature,
  isTimestampValid,
  getWhiteListedRelayers,
  MAX_MESSAGE_AGE_SECONDS,
} from "./_exclusivity/utils";
import { RelayerConfigUpdate, TypedVercelRequest } from "./_types";

const handlePostRequest = async (
  request: TypedVercelRequest<RelayerConfigUpdate>,
  response: VercelResponse
) => {
  const body = request.body as RelayerConfigUpdate;
  const { signature } = request.headers;
  const { timestamp, relayerFillLimits } = body;
  if (!isTimestampValid(timestamp, MAX_MESSAGE_AGE_SECONDS)) {
    return response.status(400).json({ message: "Message too old" });
  }

  const relayer = getRelayerFromSignature(signature, JSON.stringify(body));

  if (!getWhiteListedRelayers().includes(relayer)) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  // Handle POST request
  response.status(200).json({ message: "POST request received" });
};

const handler = async (
  request: TypedVercelRequest<any>,
  response: VercelResponse
) => {
  if (request.method === "POST") {
    return handlePostRequest(request, response);
  } else {
    // TODO: Add support for GET requests in the future
    response.setHeader("Allow", ["POST"]);
    response.status(405).end(`Method ${request.method} Not Allowed`);
  }
};

export default handler;
