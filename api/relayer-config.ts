import { VercelResponse } from "@vercel/node";
import {
  getRelayerFromSignature,
  getWhiteListedRelayers,
  isTimestampValid,
  MAX_MESSAGE_AGE_SECONDS,
} from "./_exclusivity/utils";
import { RelayerConfigUpdate, TypedRelayerConfigUpdateRequest } from "./_types";

const handler = async (
  request: TypedRelayerConfigUpdateRequest,
  response: VercelResponse
) => {
  if (request.method !== "POST") {
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }
  const body = request.body as RelayerConfigUpdate;
  const { authorization } = request.headers;
  const { timestamp } = body;
  if (!isTimestampValid(timestamp, MAX_MESSAGE_AGE_SECONDS)) {
    return response.status(400).json({ message: "Message too old" });
  }

  if (
    !authorization ||
    !getWhiteListedRelayers().includes(
      getRelayerFromSignature(authorization, JSON.stringify(body))
    )
  ) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  return response.status(200).json({ message: "POST request received" });
};

export default handler;
