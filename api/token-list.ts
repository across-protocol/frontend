import { VercelResponse } from "@vercel/node";
import { constants } from "@across-protocol/sdk-v2";
import {
  getLogger,
  handleErrorCondition,
  getFallbackTokenLogoURI,
  ENABLED_ROUTES,
  areChainsEnabled,
} from "./_utils";
import { TypedVercelRequest } from "./_types";

const handler = async (_: TypedVercelRequest<{}>, response: VercelResponse) => {
  const logger = getLogger();

  try {
    const tokensPerChain = ENABLED_ROUTES.routes
      .filter((route) => areChainsEnabled(route.fromChain, route.toChain))
      .reduce(
        (acc, route) => {
          return {
            ...acc,
            [`${route.fromTokenSymbol}-${route.fromChain}`]: {
              symbol: route.fromTokenSymbol,
              chainId: route.fromChain,
              address: route.fromTokenAddress,
              isNative: route.isNative,
              l1TokenAddress: route.l1TokenAddress,
            },
          };
        },
        {} as Record<
          string,
          {
            symbol: string;
            chainId: number;
            address: string;
            isNative: boolean;
            l1TokenAddress: string;
          }
        >
      );

    const enrichedTokensPerChain = Object.values(tokensPerChain).map(
      (token) => {
        const tokenInfo =
          constants.TOKEN_SYMBOLS_MAP[
            token.symbol === "USDC.e"
              ? "USDC"
              : (token.symbol as keyof typeof constants.TOKEN_SYMBOLS_MAP)
          ];
        return {
          ...token,
          name: tokenInfo.name,
          decimals: tokenInfo.decimals,
          logoURI: getFallbackTokenLogoURI(token.l1TokenAddress),
        };
      }
    );

    // Instruct Vercel to cache limit data for this token for 6 hours. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    logger.debug({
      at: "TokenList",
      message: "Response data",
      responseJson: enrichedTokensPerChain,
    });
    response.setHeader("Cache-Control", "s-maxage=21600");
    response.status(200).json(enrichedTokensPerChain);
  } catch (error: unknown) {
    return handleErrorCondition("token-list", response, logger, error);
  }
};

export default handler;
