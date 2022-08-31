import { useConnection } from "state/hooks";
import { useEffect, useState } from "react";
import {
  BASIS_SHIFT,
  formattedBigNumberToNumber,
  formatUnitsFnBuilder,
  getConfig,
  parseUnitsFnBuilder,
} from "utils";
import { useStakingPoolResolver } from "./useStakingPoolResolver";
import { BigNumber, BigNumberish, providers, Signer } from "ethers";
import { ERC20__factory } from "@across-protocol/contracts-v2";

export type StakingActionFunctionType = (amount: BigNumber) => Promise<void>;
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
      lpTokenFormatter: FormatterFnType;
      lpTokenParser: ParserFnType;
      stakeActionFn: StakingActionFunctionType;
      unstakeActionFn: StakingActionFunctionType;
    }
  | undefined;

export const stakingActionNOOPFn: StakingActionFunctionType = async () => {};

export const useStakingClaimRewards = () => {
  const { account, provider, signer } = useConnection();
  const { mainnetAddress } = useStakingPoolResolver();

  const [isLoading, setIsLoading] = useState(false);
  const [stakingData, setStakingData] = useState<ResolvedDataType>(undefined);

  useEffect(() => {
    setIsLoading(true);
    if (!mainnetAddress || !provider || !account || !signer) {
      setIsLoading(false);
    } else {
      resolveRequestedData(mainnetAddress, provider, signer, account).then(
        (resolvedData) => {
          setStakingData(resolvedData);
          setIsLoading(false);
        }
      );
    }
  }, [mainnetAddress, account, provider, signer]);

  return {
    isStakingDataLoading: isLoading,
    stakingData,
  };
};

/**
 * Calls on-chain data to resolve information about the AcceleratingDistributor Contract
 * @param tokenAddress The address of the ERC-20 token on the current chain
 * @param account A user address to query against the on-chain data
 * @returns A ResolvedDataType promise with the extracted information
 */
const resolveRequestedData = async (
  tokenAddress: string,
  provider: providers.Provider,
  signer: Signer,
  account: string
): Promise<ResolvedDataType> => {
  const config = getConfig();
  const hubPool = config.getHubPool();
  const acceleratingDistributor = config.getAcceleratingDistributor();

  // Get the corresponding LP token from the hub pool directly
  // Resolve the ACX reward token address from the AcceleratingDistributor
  const [{ lpToken: lpTokenAddress }, acrossTokenAddress] = await Promise.all([
    hubPool.pooledTokens(tokenAddress),
    acceleratingDistributor.rewardToken() as Promise<string>,
  ]);

  const lpTokenERC20 = ERC20__factory.connect(lpTokenAddress, provider);

  // Check information about this LP token on the AcceleratingDistributor contract
  // Resolve the provided account's outstanding rewards (if an account is connected)
  const [
    {
      enabled: poolEnabled,
      cumulativeStaked: globalAmountOfLPStaked,
      maxMultiplier,
    },
    currentUserRewardMultiplier,
    {
      rewardsOutstanding: outstandingRewards,
      cumulativeBalance: userAmountOfLPStaked,
      averageDepositTime,
    },
    availableLPTokenBalance,
    lpTokenDecimalCount,
    lpTokenSymbolName,
  ] = await Promise.all([
    acceleratingDistributor.stakingTokens(lpTokenAddress) as Promise<{
      enabled: boolean;
      baseEmissionRate: BigNumber;
      maxMultiplier: BigNumber;
      cumulativeStaked: BigNumber;
    }>,
    acceleratingDistributor.getUserRewardMultiplier(
      lpTokenAddress,
      account
    ) as Promise<BigNumber>,
    acceleratingDistributor.getUserStake(lpTokenAddress, account) as Promise<{
      cumulativeBalance: BigNumber;
      averageDepositTime: BigNumber;
      rewardsOutstanding: BigNumber;
    }>,
    lpTokenERC20.balanceOf(account),
    lpTokenERC20.decimals(),
    Promise.resolve((await lpTokenERC20.symbol()).slice(4)),
  ]);

  // Average Deposit Time retrieves the # seconds since the last deposit, weighted
  // by all the deposits in a user's account.
  const daysElapsed = formattedBigNumberToNumber(
    averageDepositTime.add("10500").mul(BASIS_SHIFT).div(86400)
  );

  const usersMultiplierPercentage = formattedBigNumberToNumber(
    currentUserRewardMultiplier.mul(BASIS_SHIFT).div(maxMultiplier).mul(100)
  );

  const usersTotalLPTokens = availableLPTokenBalance.add(userAmountOfLPStaked);

  const shareOfPool = userAmountOfLPStaked
    .add("10")
    .mul(BASIS_SHIFT)
    .div(globalAmountOfLPStaked.add("1050"))
    .mul(100);

  const lpTokenFormatter = formatUnitsFnBuilder(lpTokenDecimalCount);
  const lpTokenParser = parseUnitsFnBuilder(lpTokenDecimalCount);
  const stakeActionFn = performStakingActionBuilderFn(
    lpTokenAddress,
    signer,
    "stake"
  );
  const unstakeActionFn = performStakingActionBuilderFn(
    lpTokenAddress,
    signer,
    "unstake"
  );

  return {
    lpTokenAddress,
    acrossTokenAddress,
    poolEnabled,
    globalAmountOfLPStaked,
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
    lpTokenFormatter,
    lpTokenParser,
    stakeActionFn,
    unstakeActionFn,
  };
};

const performStakingActionBuilderFn = (
  lpTokenAddress: string,
  signer: Signer,
  action: "stake" | "unstake"
) => {
  return async (amount: BigNumber): Promise<void> => {
    const acceleratingDistributor = getConfig()
      .getAcceleratingDistributor()
      .connect(signer);
    const callingFn = acceleratingDistributor[action];
    try {
      const amountAsBigNumber = BigNumber.from(amount);
      const result = await callingFn(lpTokenAddress, amountAsBigNumber);
      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };
};
