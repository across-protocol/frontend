import { useQuery, useQueries, QueryFunctionContext } from "react-query";
import { useConnection } from "hooks";
import {
  fixedPointAdjustment,
  formattedBigNumberToNumber,
  formatUnitsFnBuilder,
  getConfig,
  hubPoolChainId,
  parseEtherLike,
  safeDivide,
  toWeiSafe,
} from "utils";
import { BigNumber, BigNumberish, providers } from "ethers";
import { ERC20__factory } from "@across-protocol/contracts-v2";
import axios from "axios";

const config = getConfig();

export type FormatterFnType = (wei: BigNumberish) => string;
export type ParserFnType = (wei: string) => BigNumber;

type ResolvedDataType =
  | {
      lpTokenAddress: string;
      lpTokenSymbolName: string;
      acrossTokenAddress: string;
      poolEnabled: boolean;
      globalAmountOfLPStaked: BigNumberish;
      userAmountOfLPStaked: BigNumberish;
      maxMultiplier: BigNumberish;
      outstandingRewards: BigNumberish;
      currentUserRewardMultiplier: BigNumberish;
      availableLPTokenBalance: BigNumberish;
      elapsedTimeSinceAvgDeposit: number;
      usersMultiplierPercentage: number;
      usersTotalLPTokens: BigNumberish;
      shareOfPool: BigNumberish;
      estimatedApy: BigNumberish;
      requiresApproval: boolean;
      isStakingPoolOfUser: boolean;
      lpTokenFormatter: FormatterFnType;
      lpTokenParser: ParserFnType;
    }
  | undefined;

export function useStakingPool(tokenAddress?: string) {
  const { account, provider } = useConnection();

  return useQuery(
    getStakingPoolQueryKey(tokenAddress, account),
    () => fetchStakingPool(tokenAddress, provider, account),
    {
      enabled: Boolean(provider && tokenAddress),
    }
  );
}

export function useAllStakingPools() {
  const { account, provider } = useConnection();

  const tokenList = config.getTokenList(hubPoolChainId);

  return useQueries(
    tokenList.map((token) => ({
      queryKey: getStakingPoolQueryKey(token.address, account),
      queryFn: ({
        queryKey,
      }: QueryFunctionContext<[string, string?, string?]>) =>
        fetchStakingPool(queryKey[1], provider, queryKey[2]),
      enabled: Boolean(provider),
    }))
  );
}

function getStakingPoolQueryKey(
  tokenAddress?: string,
  account?: string
): [string, string?, string?] {
  return ["staking-pool", tokenAddress, account];
}

/**
 * Calls on-chain data & the ACX API to resolve information about the AcceleratingDistributor Contract
 * @param tokenAddress The address of the ERC-20 token on the current chain
 * @param account A user address to query against the on-chain data
 */
const fetchStakingPool = async (
  tokenAddress?: string,
  provider?: providers.Provider | null,
  account?: string
): Promise<ResolvedDataType> => {
  if (!tokenAddress || !provider) {
    return;
  }

  const hubPool = config.getHubPool();
  const acceleratingDistributor = config.getAcceleratingDistributor();
  const acceleratingDistributorAddress = acceleratingDistributor.address;

  // Get the corresponding LP token from the hub pool directly
  // Resolve the ACX reward token address from the AcceleratingDistributor
  const [{ lpToken: lpTokenAddress }, acrossTokenAddress] = await Promise.all([
    hubPool.pooledTokens(tokenAddress),
    acceleratingDistributor.rewardToken(),
  ]);

  const lpTokenERC20 = ERC20__factory.connect(lpTokenAddress, provider);

  // Check information about this LP token on the AcceleratingDistributor contract
  // Resolve the provided account's outstanding rewards (if an account is connected) as well
  // as the global pool information
  const [
    { enabled: poolEnabled, maxMultiplier },
    currentUserRewardMultiplier,
    {
      rewardsOutstanding: outstandingRewards,
      cumulativeBalance: userAmountOfLPStaked,
      averageDepositTime,
    },
    availableLPTokenBalance,
    lpTokenDecimalCount,
    lpTokenAllowance,
    lpTokenSymbolName,
    poolQuery,
  ] = await Promise.all([
    acceleratingDistributor.stakingTokens(lpTokenAddress) as Promise<{
      enabled: boolean;
      baseEmissionRate: BigNumber;
      maxMultiplier: BigNumber;
      cumulativeStaked: BigNumber;
    }>,
    account
      ? acceleratingDistributor.getUserRewardMultiplier(lpTokenAddress, account)
      : Promise.resolve(BigNumber.from(0)),
    account
      ? acceleratingDistributor.getUserStake(lpTokenAddress, account)
      : Promise.resolve({
          rewardsOutstanding: BigNumber.from(0),
          cumulativeBalance: BigNumber.from(0),
          averageDepositTime: BigNumber.from(0),
        }),
    account ? lpTokenERC20.balanceOf(account) : BigNumber.from(0),
    lpTokenERC20.decimals(),
    account
      ? lpTokenERC20.allowance(account, acceleratingDistributorAddress)
      : BigNumber.from(0),
    Promise.resolve((await lpTokenERC20.symbol()).slice(4)),
    axios.get(`/api/pools`, {
      params: { token: tokenAddress },
    }),
  ]);

  // Resolve the data retrieved from the serverless /pools API call
  const { estimatedApy: estimatedApyFromQuery, totalPoolSize } =
    poolQuery.data as {
      estimatedApy: string;
      totalPoolSize: BigNumberish;
    };

  // The Average Deposit Time retrieves the # seconds since the last
  // deposit, weighted by all the deposits in a user's account. To calculate the
  // days elapsed, we can divide by 1 day in seconds (86,400 seconds)
  const daysElapsed = formattedBigNumberToNumber(
    averageDepositTime.mul(fixedPointAdjustment).div(86400)
  );

  // Resolve the users reward multiplier as a percentage.
  const usersMultiplierPercentage = maxMultiplier.eq(0)
    ? 0
    : formattedBigNumberToNumber(
        currentUserRewardMultiplier
          .mul(fixedPointAdjustment)
          .div(maxMultiplier)
          .mul(100)
      );

  // We need the amount of tokens that the user has in both their balance
  // and in the staked contract. We can add the staked + balance to get this
  // figure.
  const usersTotalLPTokens = availableLPTokenBalance.add(userAmountOfLPStaked);

  // We can divide the amount of LP staked in the contract with the total pool
  // size.
  const shareOfPool = safeDivide(
    userAmountOfLPStaked.mul(fixedPointAdjustment),
    BigNumber.from(totalPoolSize)
  ).mul(100);

  const estimatedApy = parseEtherLike(estimatedApyFromQuery).mul(100);

  // We can resolve custom formatter & parsers for the current LP
  // token that we are working with.
  const lpTokenFormatter = formatUnitsFnBuilder(lpTokenDecimalCount);
  const lpTokenParser = (wei: BigNumberish) =>
    toWeiSafe(wei.toString(), lpTokenDecimalCount);

  // Determine if the contract has an allowance of at least the current
  // user's entire balance.
  const requiresApproval = lpTokenAllowance.lte(availableLPTokenBalance);

  const isStakingPoolOfUser =
    BigNumber.from(userAmountOfLPStaked).gt(0) ||
    BigNumber.from(outstandingRewards).gt(0);

  return {
    lpTokenAddress,
    acrossTokenAddress,
    poolEnabled,
    globalAmountOfLPStaked: totalPoolSize,
    userAmountOfLPStaked,
    maxMultiplier,
    outstandingRewards,
    currentUserRewardMultiplier,
    availableLPTokenBalance,
    elapsedTimeSinceAvgDeposit: daysElapsed,
    lpTokenSymbolName,
    usersMultiplierPercentage,
    usersTotalLPTokens,
    shareOfPool,
    estimatedApy,
    requiresApproval,
    isStakingPoolOfUser,
    lpTokenFormatter,
    lpTokenParser,
  };
};
