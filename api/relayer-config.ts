import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";

const handler = async (
  request: TypedVercelRequest<any>,
  response: VercelResponse
) => {
  if (request.method === "GET") {
    // Handle GET request
    response.status(200).json({ message: "GET request received" });
  } else if (request.method === "POST") {
    // Handle POST request
    response.status(200).json({ message: "POST request received" });
  } else {
    // Method not allowed
    response.setHeader("Allow", ["GET", "POST"]);
    response.status(405).end(`Method ${request.method} Not Allowed`);
  }
};

export default handler;
