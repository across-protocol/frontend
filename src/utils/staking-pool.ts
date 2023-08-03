import {
  fixedPointAdjustment,
  formattedBigNumberToNumber,
  formatUnitsFnBuilder,
  getConfig,
  hubPoolChainId,
  parseEtherLike,
  toWeiSafe,
  providersTable,
  getBaseRewardsApr,
  secondsPerDay,
  secondsPerYear,
  externalLPsForStaking,
} from "utils";
import { BigNumber, BigNumberish } from "ethers";
import { ConvertDecimals } from "utils/convertdecimals";
import getApiEndpoint from "utils/serverless-api";
import { ERC20__factory } from "utils/typechain";

const config = getConfig();

export type FormatterFnType = (wei: BigNumberish) => string;
export type ParserFnType = (wei: string) => BigNumber;
export type ConverterFnType = (wei: BigNumber) => BigNumber;

export type StakingPool = {
  isExternalLP?: boolean;
  tokenLogoURI: string;
  tokenLogsURIs?: [string, string];
  tokenSymbol: string;
  tokenDisplaySymbol?: string;
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
  convertUsdToLPValue: ConverterFnType;
  convertLPValueToUsd: ConverterFnType;
  convertLPToUnderlying: ConverterFnType;
  convertUnderlyingToLP: ConverterFnType;
};

export type PoolQueryData = {
  estimatedApy: string;
  totalPoolSize: BigNumberish;
  exchangeRateCurrent: string;
};

/**
 * Calls on-chain data & the Vercel API to resolve information about the AcceleratingDistributor Contract
 * @param tokenAddress The address of the ERC-20 token on the current chain
 * @param account A user address to query against the on-chain data
 */
export async function fetchStakingPool(
  tokenAddress?: string,
  account?: string,
  acxPriceInUSD?: BigNumber
): Promise<StakingPool | undefined> {
  const provider = providersTable[hubPoolChainId];

  if (!tokenAddress || !provider) {
    return;
  }

  const hubPool = config.getHubPool();
  const acceleratingDistributor = config.getAcceleratingDistributor();
  const acceleratingDistributorAddress = acceleratingDistributor.address;

  // Check if the token is an external LP token
  const externalLP = externalLPsForStaking[hubPoolChainId].find(
    (lp) => lp.mainnetAddress?.toLowerCase() === tokenAddress?.toLowerCase()
  );
  const isExternalLP = Boolean(externalLP);

  const { logoURI, symbol, displaySymbol } = isExternalLP
    ? externalLP!
    : config.getTokenInfoByAddress(hubPoolChainId, tokenAddress);

  const lpTokenAddress = isExternalLP
    ? tokenAddress
    : (await hubPool.pooledTokens(tokenAddress)).lpToken;

  // Resolve the ACX reward token address from the AcceleratingDistributor
  const [acrossTokenAddress, { price: tokenUSDExchangeRate }] =
    await Promise.all([
      acceleratingDistributor.rewardToken(),
      getApiEndpoint().coingecko(tokenAddress, "usd"),
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
    { cumulativeBalance: userAmountOfLPStaked },
    outstandingRewards,
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
      ? acceleratingDistributor.getOutstandingRewards(lpTokenAddress, account)
      : Promise.resolve(BigNumber.from(0)),
    account
      ? acceleratingDistributor.getTimeSinceAverageDeposit(
          lpTokenAddress,
          account
        )
      : Promise.resolve(BigNumber.from(0)),
    account ? lpTokenERC20.balanceOf(account) : BigNumber.from(0),
    lpTokenERC20.decimals(),
    account
      ? lpTokenERC20.allowance(account, acceleratingDistributorAddress)
      : Promise.resolve(BigNumber.from(0)),
    isExternalLP
      ? displaySymbol || symbol
      : Promise.resolve((await lpTokenERC20.symbol()).slice(4)),
    getApiEndpoint().pools(tokenAddress, externalLP?.provider),
  ]);

  // Resolve the data retrieved from the serverless /pools API call
  const {
    estimatedApy: estimatedApyFromQuery,
    exchangeRateCurrent: lpExchangeRateToToken,
  } = poolQuery;

  const lpExchangeRateToUSD = tokenUSDExchangeRate
    .mul(lpExchangeRateToToken)
    .div(fixedPointAdjustment);

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

  const convertLPValueToUsd = (lpAmount: BigNumber) =>
    BigNumber.from(lpExchangeRateToUSD)
      .mul(ConvertDecimals(lpTokenDecimalCount, 18)(lpAmount))
      .div(fixedPointAdjustment);

  const convertUsdToLPValue = (usdAmount: BigNumber) =>
    BigNumber.from(
      ConvertDecimals(
        18,
        lpTokenDecimalCount
      )(usdAmount.mul(fixedPointAdjustment).div(lpExchangeRateToUSD))
    );

  const convertLPToUnderlying = (lp: BigNumber) =>
    lp.mul(lpExchangeRateToToken).div(fixedPointAdjustment);
  const convertUnderlyingToLP = (underlying: BigNumber) =>
    underlying.mul(fixedPointAdjustment).div(lpExchangeRateToToken);

  const usdCumulativeStakedValue = convertLPValueToUsd(cumulativeStaked);
  const usdStakedValue = convertLPValueToUsd(userAmountOfLPStaked);

  // Estimated base rewards APR
  const baseRewardsApy = getBaseRewardsApr(
    baseEmissionRate
      .mul(secondsPerYear)
      .mul(acxPriceInUSD || BigNumber.from(0))
      .div(fixedPointAdjustment),
    usdCumulativeStakedValue
  );

  // We need the amount of tokens that the user has in both their balance
  // and in the staked contract. We can add the staked + balance to get this
  // figure.
  const usersTotalLPTokens = availableLPTokenBalance.add(userAmountOfLPStaked);

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
  const requiresApproval = lpTokenAllowance.lt(availableLPTokenBalance);

  const isStakingPoolOfUser =
    BigNumber.from(usersTotalLPTokens).gt(0) ||
    BigNumber.from(outstandingRewards).gt(0);

  return {
    isExternalLP,
    tokenLogoURI: logoURI,
    tokenLogsURIs: externalLP?.logoURIs,
    tokenSymbol: symbol,
    tokenDisplaySymbol: displaySymbol,
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
    convertUsdToLPValue,
    convertLPValueToUsd,
    convertLPToUnderlying,
    convertUnderlyingToLP,
  };
}

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
  convertUsdToLPValue: () => BigNumber.from(0),
  convertLPValueToUsd: () => BigNumber.from(0),
  convertLPToUnderlying: () => BigNumber.from(0),
  convertUnderlyingToLP: () => BigNumber.from(0),
};
