import { VercelResponse } from "@vercel/node";
import {
  getRelayerFromSignature,
  getWhiteListedRelayers,
  isTimestampValid,
  MAX_MESSAGE_AGE_SECONDS,
  updateLimits,
} from "./_exclusivity/utils";
import {
  RelayerConfigUpdate,
  RelayerFillLimitArraySchema,
  TypedRelayerConfigUpdateRequest,
} from "./_types";

const handler = async (
  request: TypedRelayerConfigUpdateRequest,
  response: VercelResponse
) => {
  if (request.method !== "POST") {
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  const body = request.body as RelayerConfigUpdate;
  const { authorization } = request.headers;
  const {
    originChainId,
    destinationChainId,
    inputToken,
    outputToken,
    relayerFillLimits,
    timestamp,
  } = body;
  if (!isTimestampValid(timestamp, MAX_MESSAGE_AGE_SECONDS)) {
    return response.status(400).json({ message: "Message too old" });
  }

  if (!authorization) {
    return response.status(401).json({ message: "Unauthorized" });
  }
  const relayer = getRelayerFromSignature(authorization, JSON.stringify(body));

  if (!getWhiteListedRelayers().includes(relayer)) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  if (!RelayerFillLimitArraySchema.is(relayerFillLimits)) {
    return response
      .status(400)
      .json({ message: "Invalid configuration payload" });
  }

  await updateLimits(
    relayer,
    originChainId,
    inputToken,
    destinationChainId,
    outputToken,
    relayerFillLimits
  );
  return response.status(200).json({ message: "POST request received" });
};

export default handler;
