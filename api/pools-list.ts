import { VercelResponse } from "@vercel/node";
import { utils } from "ethers";

import { TypedVercelRequest } from "./_types";

import {
  getLogger,
  handleErrorCondition,
  HUB_POOL_CHAIN_ID,
  fetchStakingPool,
} from "./_utils";
import { ENABLED_POOLS_UNDERLYING_TOKENS } from "./_constants";

const handler = async (_: TypedVercelRequest<{}>, response: VercelResponse) => {
  const logger = getLogger();
  logger.debug({
    at: "PoolsList",
    message: "Query data",
  });
  try {
    const enabledPoolsUnderlyingAddresses = ENABLED_POOLS_UNDERLYING_TOKENS.map(
      (token) => token.addresses[HUB_POOL_CHAIN_ID]
    ).filter((address) => Boolean(address));

    const stakingPools = await Promise.all(
      enabledPoolsUnderlyingAddresses.map((tokenAddress) =>
        fetchStakingPool(tokenAddress)
      )
    );

    const formattedPools = stakingPools.flatMap((pool) => {
      const underlyingToken = ENABLED_POOLS_UNDERLYING_TOKENS.find(
        (token) =>
          token.addresses[HUB_POOL_CHAIN_ID] === pool.poolUnderlyingTokenAddress
      );

      if (!underlyingToken) {
        return [];
      }

      return {
        name: underlyingToken.symbol,
        chain: HUB_POOL_CHAIN_ID === 1 ? "Ethereum" : "Goerli",
        protocol: "Across",
        base: utils.formatEther(pool.apyData.poolApy),
        reward: utils.formatEther(pool.apyData.rewardsApy),
        rewards: {
          ACX: utils.formatEther(pool.apyData.rewardsApy),
        },
        apy: utils.formatEther(pool.apyData.totalApy),
        tvl: utils.formatEther(pool.usdTotalPoolSize),
        link: "https://across.to/rewards",
        active: true,
        composition: {
          [underlyingToken.symbol]: utils.formatUnits(
            pool.totalPoolSize,
            underlyingToken.decimals
          ),
        },
        contract_address: pool.acceleratingDistributorAddress,
        tokens: [underlyingToken.symbol],
        underlying_tokens: [underlyingToken.addresses[HUB_POOL_CHAIN_ID]],
      };
    });

    // Instruct Vercel to cache data for 5 minutes. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    logger.debug({
      at: "PoolsList",
      message: "Response data",
      responseJson: formattedPools,
    });
    response.setHeader("Cache-Control", "s-maxage=300");
    response.status(200).json(formattedPools);
  } catch (error: unknown) {
    return handleErrorCondition("pools", response, logger, error);
  }
};

export default handler;
