import { VercelResponse } from "@vercel/node";
import {
  getRelayerFromSignature,
  isMessageFresh,
  whiteListedRelayers,
} from "./_exclusivity/utils";
import { TypedVercelRequest } from "./_types";

export const MAX_MESSAGE_AGE_SECONDS = 300;

const handleGetRequest = async (
  request: TypedVercelRequest<any>,
  response: VercelResponse
) => {
  const { signature, message } = request.query;

  const { timestamp, ...restOfMessage } = JSON.parse(message);
  if (!isMessageFresh(timestamp, MAX_MESSAGE_AGE_SECONDS)) {
    return response.status(400).json({ message: "Message too old" });
  }

  const relayer = await getRelayerFromSignature(
    signature,
    JSON.stringify(restOfMessage)
  );

  if (!whiteListedRelayers.includes(relayer)) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  // Handle authenticated GET request
  response.status(200).json({ message: "Authenticated GET request received" });
};

const handlePostRequest = async (
  request: TypedVercelRequest<any>,
  response: VercelResponse
) => {
  const { signature, message } = request.body;

  const { timestamp, ...restOfMessage } = message;
  if (!isMessageFresh(timestamp, MAX_MESSAGE_AGE_SECONDS)) {
    return response.status(400).json({ message: "Message too old" });
  }

  const relayer = await getRelayerFromSignature(
    signature,
    JSON.stringify(restOfMessage)
  );

  if (!whiteListedRelayers.includes(relayer)) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  // Handle POST request
  response.status(200).json({ message: "POST request received" });
};

const handler = async (
  request: TypedVercelRequest<any>,
  response: VercelResponse
) => {
  if (request.method && ["GET", "POST"].includes(request.method)) {
    return request.method === "GET"
      ? handleGetRequest(request, response)
      : handlePostRequest(request, response);
  } else {
    response.setHeader("Allow", ["GET", "POST"]);
    response.status(405).end(`Method ${request.method} Not Allowed`);
  }
};

export default handler;
