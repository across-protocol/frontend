import { useConnection } from "state/hooks";
import { useEffect, useState } from "react";
import { getConfig } from "utils";
import { useStakingPoolResolver } from "./useStakingPoolResolver";
import { BigNumber, BigNumberish, providers } from "ethers";
import { ERC20__factory } from "@across-protocol/contracts-v2";

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
      averageDepositTime: BigNumberish;
    }
  | undefined;

export const useStakingClaimRewards = () => {
  const { account, provider } = useConnection();
  const { mainnetAddress } = useStakingPoolResolver();

  const [isLoading, setIsLoading] = useState(false);
  const [stakingData, setStakingData] = useState<ResolvedDataType>(undefined);

  useEffect(() => {
    setIsLoading(true);
    if (!mainnetAddress || !provider || !account) {
      setIsLoading(false);
    } else {
      resolveRequestedData(mainnetAddress, provider, account).then(
        (resolvedData) => {
          setStakingData(resolvedData);
          setIsLoading(false);
        }
      );
    }
  }, [mainnetAddress, account, provider]);

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
    Promise.resolve((await lpTokenERC20.symbol()).slice(4)),
  ]);

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
    averageDepositTime,
    lpTokenSymbolName,
  };
};
