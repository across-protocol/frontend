import { VercelResponse } from "@vercel/node";
import { Infer, optional, string, type } from "superstruct";
import {
  getLogger,
  handleErrorCondition,
  positiveIntStr,
  boolStr,
} from "./_utils";
import { TypedVercelRequest } from "./_types";

import mainnetChains from "../src/data/chains_1.json";

const ChainsQueryParams = type({
  inputTokenSymbol: optional(string()),
  outputTokenSymbol: optional(string()),
  chainId: optional(positiveIntStr()),
  omitTokens: optional(boolStr()),
});

type ChainsQueryParams = Infer<typeof ChainsQueryParams>;

const handler = async (
  { query }: TypedVercelRequest<ChainsQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Chains",
    message: "Query data",
    query,
  });

  try {
    const { inputTokenSymbol, outputTokenSymbol, chainId, omitTokens } = query;

    const filteredChains = mainnetChains.filter((chain) => {
      return (
        (inputTokenSymbol
          ? !!chain.inputTokens.find(
              (token) =>
                token.symbol.toUpperCase() === inputTokenSymbol.toUpperCase()
            )
          : true) &&
        (outputTokenSymbol
          ? !!chain.outputTokens.find(
              (token) =>
                token.symbol.toUpperCase() === outputTokenSymbol.toUpperCase()
            )
          : true) &&
        (chainId ? chain.chainId === Number(chainId) : true)
      );
    });

    if (omitTokens === "true") {
      filteredChains.forEach((chain) => {
        chain.inputTokens = [];
        chain.outputTokens = [];
      });
    }

    logger.debug({
      at: "Chains",
      message: "Response data",
      responseJson: filteredChains,
    });
    response.setHeader("Cache-Control", "s-maxage=3600");
    response.status(200).json(filteredChains);
  } catch (error: unknown) {
    return handleErrorCondition("chains", response, logger, error);
  }
};

export default handler;
