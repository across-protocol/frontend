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
import { assert, Infer, optional, string, type } from "superstruct";
import { TypedVercelRequest } from "./_types";
import { getEnvs } from "./_env";

const { RPC_PROXY_AUTH_TOKEN, VERCEL_URL, VERCEL_BRANCH_URL } = getEnvs();

const ALLOWED_ORIGINS = [
  resolveVercelEndpoint(),
  `https://${VERCEL_URL}`,
  `https://${VERCEL_BRANCH_URL}`,
];

const PROTECTED_RPC_MAP: Record<number, string> = {
  [CHAIN_IDs.LENS]: "https://api.lens.matterhosted.dev",
};

const RpcProxyQueryParamsSchema = type({
  chainId: positiveIntStr(),
  authToken: optional(string()),
});

type RpcProxyQueryParams = Infer<typeof RpcProxyQueryParamsSchema>;

const handler = async (
  request: TypedVercelRequest<RpcProxyQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    authenticate(request);
    const { body, query } = request;

    assert(query, RpcProxyQueryParamsSchema);
    const chainId = Number(query.chainId);

    if (!(chainId in PROTECTED_RPC_MAP)) {
      throw new InvalidParamError({
        message: `No proxy setup for chainID ${chainId}`,
        param: "chainId",
      });
    }

    const RPC_URL = PROTECTED_RPC_MAP[chainId];

    logger.debug({
      at: "rpc-proxy",
      message: "Incoming RPC proxy request",
      chainId,
      requestBody: body,
    });

    const data: unknown = await fetch(RPC_URL, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        ...getProviderHeaders(chainId),
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    logger.debug({
      at: "rpc-proxy",
      message: "Successful RPC proxy response",
      response: data,
    });

    response.status(200).json(data);
  } catch (error: unknown) {
    return handleErrorCondition("rpc-proxy", response, logger, error);
  }
};

export default handler;

function authenticate({
  query,
  headers,
}: TypedVercelRequest<RpcProxyQueryParams>) {
  const origin = headers?.origin;

  // First check if auth token is provided
  if (query.authToken) {
    const authenticated = query.authToken === RPC_PROXY_AUTH_TOKEN;
    if (!authenticated) {
      throw new UnauthorizedError({
        message: `Not Allowed: Invalid auth token ${query.authToken}`,
      });
    }
    // if not then we may allow access for same origin requests (from our frontend)
  } else if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    throw new UnauthorizedError({
      message: "Origin not allowed",
    });
  }
}
