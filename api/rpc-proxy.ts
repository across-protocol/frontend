import { VercelResponse } from "@vercel/node";
import {
  handleErrorCondition,
  InvalidParamError,
  UnauthorizedError,
} from "./_errors";
import {
  getLogger,
  getProviderHeaders,
  positiveIntStr,
  resolveVercelEndpoint,
} from "./_utils";
import { CHAIN_IDs } from "@across-protocol/constants";
import { assert, Infer, type } from "superstruct";
import { TypedVercelRequest } from "./_types";

const PROTECTED_RPC_MAP: Record<number, string> = {
  [CHAIN_IDs.LENS]: "https://api.lens.matterhosted.dev",
};

const ALLOWED_ORIGINS = [resolveVercelEndpoint()]; // add more here

const RpcProxyQueryParamsSchema = type({
  chainId: positiveIntStr(),
});

type RpcProxyQueryParams = Infer<typeof RpcProxyQueryParamsSchema>;

const handler = async (
  { body, headers, query }: TypedVercelRequest<RpcProxyQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    assert(query, RpcProxyQueryParamsSchema);
    const chainId = Number(query.chainId);

    if (!(chainId in PROTECTED_RPC_MAP)) {
      throw new InvalidParamError({
        message: `This proxy does not yet supported chainID ${chainId}`,
        param: "chainId",
      });
    }

    const RPC_URL = PROTECTED_RPC_MAP[chainId];

    logger.debug({
      at: "rpc-proxy",
      message: "Incoming RPC",
      chainId,
      requestBody: body,
    });

    const origin = headers.origin;

    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      throw new UnauthorizedError({
        message: "Origin not allowed",
      });
    }

    // TODO: allow auth token (useful for calling from non-public environments)

    const data: unknown = await fetch(RPC_URL, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        ...getProviderHeaders(chainId),
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
    return handleErrorCondition("rpc-proxy", response, logger, error);
  }
};

export default handler;
