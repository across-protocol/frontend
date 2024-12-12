import { VercelResponse } from "@vercel/node";
import {
  authenticateRelayer,
  getLimits,
  isTimestampValid,
  MAX_MESSAGE_AGE_SECONDS,
  updateLimits,
} from "./_exclusivity/utils";
import {
  ConfigUpdateGetSchema,
  RelayerConfigUpdate,
  RelayerFillLimitArraySchema,
  TypedRelayerConfigUpdateGetRequest,
  TypedRelayerConfigUpdateRequest,
} from "./_types";

const handler = async (
  request: TypedRelayerConfigUpdateRequest | TypedRelayerConfigUpdateGetRequest,
  response: VercelResponse
) => {
  switch (request.method) {
    case "GET":
      return handleGet(request as TypedRelayerConfigUpdateGetRequest, response);
    case "POST":
      return handlePost(request as TypedRelayerConfigUpdateRequest, response);
    default:
      return response.status(405).end(`Method ${request.method} Not Allowed`);
  }
};

const handleGet = async (
  request: TypedRelayerConfigUpdateGetRequest,
  response: VercelResponse
) => {
  const { authorization } = request.headers;

  const [error, query] = ConfigUpdateGetSchema.validate(request.query);
  if (error) {
    return response
      .status(400)
      .json({ message: "Invalid configuration payload" });
  }

  const relayer = authenticateRelayer(authorization, query);
  if (!relayer) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  const { originChainId, destinationChainId, inputToken, outputToken } = query;

  const limits = await getLimits(
    relayer,
    Number(originChainId),
    Number(destinationChainId),
    inputToken,
    outputToken
  );
  return response.status(200).json(limits);
};

const handlePost = async (
  request: TypedRelayerConfigUpdateRequest,
  response: VercelResponse
) => {
  const body = request.body as RelayerConfigUpdate;
  const { authorization } = request.headers;
  const { relayerFillLimits, timestamp } = body;

  if (!isTimestampValid(timestamp, MAX_MESSAGE_AGE_SECONDS)) {
    return response.status(400).json({ message: "Message too old" });
  }

  const relayer = authenticateRelayer(authorization, body);
  if (!relayer) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  if (!RelayerFillLimitArraySchema.is(relayerFillLimits)) {
    return response
      .status(400)
      .json({ message: "Invalid configuration payload" });
  }

  await updateLimits(relayer, relayerFillLimits);
  return response.status(200).json({ message: "POST request received" });
};

export default handler;
