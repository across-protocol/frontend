import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";
import { ethers } from "ethers";

// TODO: prevent replay attacks by checking the timestamp of the message or using a nonce
const getRelayerFromSignature = async (signature: string, message: string) => {
  return ethers.utils.verifyMessage(message, signature);
};

// TODO: get this from gh
const whiteListedRelayers = [
  "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D", // dev wallet
];

const handleGetRequest = async (
  request: TypedVercelRequest<any>,
  response: VercelResponse
) => {
  const { signature, message } = request.query;

  const relayer = await getRelayerFromSignature(signature, message);

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

  const relayer = await getRelayerFromSignature(
    signature,
    JSON.stringify(message)
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
  if (request.method === "GET") {
    await handleGetRequest(request, response);
  } else if (request.method === "POST") {
    await handlePostRequest(request, response);
  } else {
    // Method not allowed
    response.setHeader("Allow", ["GET", "POST"]);
    response.status(405).end(`Method ${request.method} Not Allowed`);
  }
};

export default handler;
