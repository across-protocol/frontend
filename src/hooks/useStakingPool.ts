import { useQuery, useQueries, QueryFunctionContext } from "react-query";
import { useConnection } from "hooks/useConnection";
import {
  fixedPointAdjustment,
  formattedBigNumberToNumber,
  formatUnitsFnBuilder,
  getConfig,
  hubPoolChainId,
  parseEtherLike,
  safeDivide,
  toWeiSafe,
  providersTable,
  getBaseRewardsApr,
  secondsPerDay,
  secondsPerYear,
} from "utils";
import { BigNumber, BigNumberish } from "ethers";
import { ERC20__factory } from "@across-protocol/contracts-v2";
import axios from "axios";
import { ConvertDecimals } from "utils/convertdecimals";
import { useCoingeckoPrice } from "./useCoingeckoPrice";

const config = getConfig();

export type FormatterFnType = (wei: BigNumberish) => string;
export type ParserFnType = (wei: string) => BigNumber;

export type StakingPool = {
  tokenLogoURI: string;
  tokenSymbol: string;
  lpTokenAddress: string;
  lpTokenSymbolName: string;
  acrossTokenAddress: string;
  poolEnabled: boolean;
  globalAmountOfLPStaked: BigNumber;
  userAmountOfLPStaked: BigNumber;
  userAmountOfLPStakedInUSD: BigNumber;
  maxMultiplier: BigNumber;
  outstandingRewards: BigNumber;
  currentUserRewardMultiplier: BigNumber;
  availableLPTokenBalance: BigNumber;
  elapsedTimeSinceAvgDeposit: number;
  usersMultiplierPercentage: number;
  usersTotalLPTokens: BigNumber;
  baseEmissionRate: BigNumber;
  shareOfPool: BigNumber;
  secondsToMaxMultiplier: BigNumber;
  lpTokenDecimalCount: number;
  apyData: {
    poolApy: BigNumber;
    baseRewardsApy: BigNumber;
    rewardsApy: BigNumber;
    maxApy: BigNumber;
    minApy: BigNumber;
    totalApy: BigNumber;
  };
  requiresApproval: boolean;
  isStakingPoolOfUser: boolean;
  lpTokenFormatter: FormatterFnType;
  lpTokenParser: ParserFnType;
};

type PoolQueryData = {
  estimatedApy: string;
  totalPoolSize: BigNumberish;
  exchangeRateCurrent: string;
};

export function useStakingPool(tokenAddress?: string) {
  const { account } = useConnection();

  const acxPriceQuery = useCoingeckoPrice(
    config.getAcrossTokenAddress(),
    "usd"
  );
  const acxPrice = acxPriceQuery.data?.price ?? parseEtherLike("1.0"); // FIXME: Remove this for launch

  return useQuery(
    getStakingPoolQueryKey(tokenAddress, account),
    () => fetchStakingPool(tokenAddress, account, acxPrice),
    {
      refetchInterval: 15_000,
      enabled: Boolean(tokenAddress) && Boolean(acxPrice),
    }
  );
}

export function useAllStakingPools() {
  const { account } = useConnection();

  const tokenList = config.getTokenList(hubPoolChainId);

  const acxPriceQuery = useCoingeckoPrice(
    config.getAcrossTokenAddress(),
    "usd"
  );
  const acxPrice = acxPriceQuery.data?.price;

  return useQueries(
    tokenList
      .filter((token) => !token.isNative)
      .map((token) => ({
        enabled: Boolean(acxPrice),
        refetchInterval: 15_000,
        queryKey: getStakingPoolQueryKey(token.address, account),
        queryFn: ({
          queryKey,
        }: QueryFunctionContext<[string, string?, string?]>) =>
          fetchStakingPool(queryKey[1], queryKey[2], acxPrice),
      }))
  );
}

export function useMaxApyOfAllStakingPools() {
  const allStakingPoolQueries = useAllStakingPools();

  const isLoading = allStakingPoolQueries.some((query) => query.isLoading);
  const allMaxApys = allStakingPoolQueries
    .map((query) => query.data?.apyData.maxApy || BigNumber.from(0))
    .sort((a, b) => (a.lt(b) ? -1 : a.gt(b) ? 1 : 0));
  const [maxApyOfAllStakingPools] = allMaxApys.slice(-1);
  return { isLoading, maxApyOfAllStakingPools, allMaxApys };
}

export function useAcrossStakingPool() {
  const acrossTokenAddress = config.getAcrossTokenAddress();
  return useStakingPool(acrossTokenAddress);
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
  account?: string,
  acxPriceInUSD?: BigNumber
): Promise<StakingPool | undefined> => {
  const provider = providersTable[hubPoolChainId];

  if (!tokenAddress || !provider) {
    return;
  }

  const hubPool = config.getHubPool();
  const acceleratingDistributor = config.getAcceleratingDistributor();
  const acceleratingDistributorAddress = acceleratingDistributor.address;
  const { logoURI, symbol } = config.getTokenInfoByAddress(
    hubPoolChainId,
    tokenAddress
  );

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
    {
      enabled: poolEnabled,
      maxMultiplier,
      secondsToMaxMultiplier,
      baseEmissionRate,
      cumulativeStaked,
    },
    currentUserRewardMultiplier,
    {
      rewardsOutstanding: outstandingRewards,
      cumulativeBalance: userAmountOfLPStaked,
    },
    averageDepositTime,
    availableLPTokenBalance,
    lpTokenDecimalCount,
    lpTokenAllowance,
    lpTokenSymbolName,
    poolQuery,
  ] = await Promise.all([
    acceleratingDistributor.stakingTokens(lpTokenAddress),
    account
      ? acceleratingDistributor.getUserRewardMultiplier(lpTokenAddress, account)
      : Promise.resolve(BigNumber.from(0)),
    account
      ? acceleratingDistributor.getUserStake(lpTokenAddress, account)
      : Promise.resolve({
          rewardsOutstanding: BigNumber.from(0),
          cumulativeBalance: BigNumber.from(0),
        }),
    account
      ? acceleratingDistributor.getTimeSinceAverageDeposit(
          lpTokenAddress,
          account
        )
      : BigNumber.from(0),
    account ? lpTokenERC20.balanceOf(account) : BigNumber.from(0),
    lpTokenERC20.decimals(),
    account
      ? lpTokenERC20.allowance(account, acceleratingDistributorAddress)
      : BigNumber.from(0),
    Promise.resolve((await lpTokenERC20.symbol()).slice(4)),
    axios.get<PoolQueryData>(`/api/pools`, {
      params: { token: tokenAddress },
    }),
  ]);

  // Resolve the data retrieved from the serverless /pools API call
  const {
    estimatedApy: estimatedApyFromQuery,
    totalPoolSize,
    exchangeRateCurrent: lpExchangeRateToUSD,
  } = poolQuery.data;

  // The Average Deposit Time retrieves the # seconds since the last
  // deposit, weighted by all the deposits in a user's account. To calculate the
  // days elapsed, we can divide by 1 day in seconds (86,400 seconds)
  const daysElapsed = userAmountOfLPStaked.eq(0)
    ? 0
    : new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(Number(averageDepositTime) / secondsPerDay);

  // Resolve the users reward multiplier as a percentage.
  const usersMultiplierPercentage = maxMultiplier.eq(0)
    ? 0
    : formattedBigNumberToNumber(
        currentUserRewardMultiplier
          .mul(fixedPointAdjustment)
          .div(maxMultiplier)
          .mul(100)
      );

  const usdCumulativeStakedValue = BigNumber.from(lpExchangeRateToUSD)
    .mul(ConvertDecimals(lpTokenDecimalCount, 18)(cumulativeStaked))
    .div(fixedPointAdjustment);
  const usdStakedValue = BigNumber.from(lpExchangeRateToUSD)
    .mul(ConvertDecimals(lpTokenDecimalCount, 18)(userAmountOfLPStaked))
    .div(fixedPointAdjustment);

  // Estimated base rewards APR
  const baseRewardsApy = getBaseRewardsApr(
    baseEmissionRate
      .mul(secondsPerYear)
      .mul(acxPriceInUSD || BigNumber.from(0))
      .div(fixedPointAdjustment),
    usdCumulativeStakedValue,
    usdStakedValue
  );

  // We need the amount of tokens that the user has in both their balance
  // and in the staked contract. We can add the staked + balance to get this
  // figure.
  const usersTotalLPTokens = availableLPTokenBalance.add(userAmountOfLPStaked);

  // We can divide the amount of LP staked in the contract with the total pool
  // size.
  const shareOfPool = BigNumber.from(totalPoolSize).isZero()
    ? BigNumber.from(0)
    : safeDivide(
        userAmountOfLPStaked.mul(fixedPointAdjustment),
        BigNumber.from(totalPoolSize)
      ).mul(100);

  // Resolve APY Information
  const poolApy = parseEtherLike(estimatedApyFromQuery);
  const maxApy = poolApy.add(
    baseRewardsApy.mul(maxMultiplier).div(fixedPointAdjustment)
  );
  const minApy = poolApy.add(baseRewardsApy);
  const rewardsApy = baseRewardsApy
    .mul(
      userAmountOfLPStaked.gt(0)
        ? currentUserRewardMultiplier
        : parseEtherLike("1")
    )
    .div(fixedPointAdjustment);
  const totalApy = poolApy.add(rewardsApy);

  // We can resolve custom formatter & parsers for the current LP
  // token that we are working with.
  const lpTokenFormatter = formatUnitsFnBuilder(lpTokenDecimalCount);
  const lpTokenParser = (wei: BigNumberish) =>
    toWeiSafe(wei.toString(), lpTokenDecimalCount);

  // Determine if the contract has an allowance of at least the current
  // user's entire balance.
  const requiresApproval = lpTokenAllowance.lte(availableLPTokenBalance);

  const isStakingPoolOfUser =
    BigNumber.from(usersTotalLPTokens).gt(0) ||
    BigNumber.from(outstandingRewards).gt(0);

  return {
    tokenLogoURI: logoURI,
    tokenSymbol: symbol,
    lpTokenAddress,
    acrossTokenAddress,
    poolEnabled,
    baseEmissionRate,
    globalAmountOfLPStaked: cumulativeStaked,
    userAmountOfLPStaked,
    userAmountOfLPStakedInUSD: usdStakedValue,
    maxMultiplier,
    outstandingRewards,
    currentUserRewardMultiplier,
    availableLPTokenBalance,
    elapsedTimeSinceAvgDeposit: Number(daysElapsed),
    lpTokenSymbolName,
    usersMultiplierPercentage,
    usersTotalLPTokens,
    shareOfPool,
    lpTokenDecimalCount: lpTokenDecimalCount,
    apyData: {
      poolApy,
      maxApy,
      minApy,
      totalApy,
      baseRewardsApy,
      rewardsApy,
    },
    requiresApproval,
    isStakingPoolOfUser,
    secondsToMaxMultiplier,
    lpTokenFormatter,
    lpTokenParser,
  };
};

export const DEFAULT_STAKING_POOL_DATA: StakingPool = {
  tokenLogoURI: "",
  tokenSymbol: "",
  lpTokenAddress: "",
  lpTokenFormatter: () => "",
  lpTokenParser: () => BigNumber.from(0),
  baseEmissionRate: BigNumber.from(0),
  lpTokenSymbolName: "",
  acrossTokenAddress: "",
  availableLPTokenBalance: BigNumber.from(0),
  elapsedTimeSinceAvgDeposit: 0,
  poolEnabled: true,
  requiresApproval: false,
  userAmountOfLPStaked: BigNumber.from(0),
  userAmountOfLPStakedInUSD: BigNumber.from(0),
  usersMultiplierPercentage: 0,
  usersTotalLPTokens: BigNumber.from(0),
  currentUserRewardMultiplier: BigNumber.from(0),
  isStakingPoolOfUser: false,
  maxMultiplier: BigNumber.from(3),
  globalAmountOfLPStaked: BigNumber.from(0),
  outstandingRewards: BigNumber.from(0),
  shareOfPool: BigNumber.from(0),
  secondsToMaxMultiplier: BigNumber.from(0),
  lpTokenDecimalCount: 18,
  apyData: {
    maxApy: BigNumber.from(0),
    poolApy: BigNumber.from(0),
    totalApy: BigNumber.from(0),
    baseRewardsApy: BigNumber.from(0),
    rewardsApy: BigNumber.from(0),
    minApy: BigNumber.from(0),
  },
};
