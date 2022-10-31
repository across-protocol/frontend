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
} from "utils";
import { BigNumber, BigNumberish } from "ethers";
import { ERC20__factory } from "@across-protocol/contracts-v2";
import axios from "axios";

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
  maxMultiplier: BigNumber;
  outstandingRewards: BigNumber;
  currentUserRewardMultiplier: BigNumber;
  availableLPTokenBalance: BigNumber;
  elapsedTimeSinceAvgDeposit: number;
  usersMultiplierPercentage: number;
  usersTotalLPTokens: BigNumber;
  shareOfPool: BigNumber;
  apyData: {
    poolApy: BigNumber;
    baseRewardsApy: BigNumber;
    maxApy: BigNumber;
    totalApy: BigNumber;
  };
  requiresApproval: boolean;
  isStakingPoolOfUser: boolean;
  lpTokenFormatter: FormatterFnType;
  lpTokenParser: ParserFnType;
};

export function useStakingPool(tokenAddress?: string) {
  const { account } = useConnection();

  return useQuery(
    getStakingPoolQueryKey(tokenAddress, account),
    () => fetchStakingPool(tokenAddress, account),
    {
      refetchInterval: 15_000,
      enabled: Boolean(tokenAddress),
    }
  );
}

export function useAllStakingPools() {
  const { account } = useConnection();

  const tokenList = config.getTokenList(hubPoolChainId);

  return useQueries(
    tokenList.map((token) => ({
      refetchInterval: 15_000,
      queryKey: getStakingPoolQueryKey(token.address, account),
      queryFn: ({
        queryKey,
      }: QueryFunctionContext<[string, string?, string?]>) =>
        fetchStakingPool(queryKey[1], queryKey[2]),
    }))
  );
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
  account?: string
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
    { enabled: poolEnabled, maxMultiplier, baseEmissionRate },
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
    axios.get<{
      estimatedApy: string;
      totalPoolSize: BigNumberish;
    }>(`/api/pools`, {
      params: { token: tokenAddress },
    }),
  ]);

  // Resolve the data retrieved from the serverless /pools API call
  const { estimatedApy: estimatedApyFromQuery, totalPoolSize } = poolQuery.data;

  // The Average Deposit Time retrieves the # seconds since the last
  // deposit, weighted by all the deposits in a user's account. To calculate the
  // days elapsed, we can divide by 1 day in seconds (86,400 seconds)
  const daysElapsed = averageDepositTime.div(86400).toNumber();

  // Resolve the users reward multiplier as a percentage.
  const usersMultiplierPercentage = maxMultiplier.eq(0)
    ? 0
    : formattedBigNumberToNumber(
        currentUserRewardMultiplier
          .mul(fixedPointAdjustment)
          .div(maxMultiplier)
          .mul(100)
      );

  // Estimated base rewards APR
  const baseRewardsApy = getBaseRewardsApr(
    baseEmissionRate,
    BigNumber.from(totalPoolSize),
    userAmountOfLPStaked
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
  const totalApy = poolApy.add(
    baseRewardsApy.mul(
      userAmountOfLPStaked.gt(0) ? usersMultiplierPercentage / 100 : 1
    )
  );

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
    tokenLogoURI: logoURI,
    tokenSymbol: symbol,
    lpTokenAddress,
    acrossTokenAddress,
    poolEnabled,
    globalAmountOfLPStaked: BigNumber.from(totalPoolSize),
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
    apyData: {
      poolApy,
      maxApy,
      totalApy,
      baseRewardsApy,
    },
    requiresApproval,
    isStakingPoolOfUser,
    lpTokenFormatter,
    lpTokenParser,
  };
};
