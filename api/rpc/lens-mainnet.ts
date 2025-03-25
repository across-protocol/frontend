import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleErrorCondition, UnauthorizedError } from "../_errors";
import { getLogger, getProviderHeaders } from "../_utils";
import { CHAIN_IDs } from "@across-protocol/constants";

const RPC_URL = "https://api.lens.matterhosted.dev";
const CHAIN_ID = CHAIN_IDs.LENS;
const ALLOWED_ORIGINS = ["https://app.across.to"];

const handler = async (
  { body, headers }: VercelRequest,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    logger.debug({
      at: "rpc/lens-mainnet",
      message: "Incoming RPC",
      requestBody: body,
    });

    const origin = headers.origin;

    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      throw new UnauthorizedError({
        message: "Origin not allowed",
      });
    }

    // TODO: allow auth token (useful for calling from non-public environments)

    const data: unknown = await fetch(RPC_URL, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        ...getProviderHeaders(CHAIN_ID),
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    logger.debug({
      at: "rpc/lens-mainnet",
      message: "Incoming RPC",
      response: data,
    });

    response.status(200).json(data);
  } catch (error: unknown) {
    return handleErrorCondition("rpc/lens-mainnet", response, logger, error);
  }
};

export default handler;
