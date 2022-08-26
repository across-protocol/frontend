import { useConnection } from "state/hooks";
import { useEffect, useState } from "react";
import { getConfig } from "utils";
import { useStakingPoolResolver } from "./useStakingPoolResolver";
import { BigNumber, BigNumberish } from "ethers";

type ResolvedDataType =
  | {
      lpTokenAddress: string;
      acrossTokenAddress: string;
      poolEnabled: boolean;
      cumulativeStaked: BigNumberish;
      maxMultiplier: BigNumberish;
      outstandingRewards: BigNumberish;
    }
  | undefined;

export const useStakingClaimRewards = () => {
  const { account } = useConnection();
  const { mainnetAddress } = useStakingPoolResolver();

  const [isLoading, setIsLoading] = useState(false);
  const [stakingData, setStakingData] = useState<ResolvedDataType>(undefined);

  useEffect(() => {
    setIsLoading(true);
    resolveRequestedData(mainnetAddress!, account).then((resolvedData) => {
      setStakingData(resolvedData);
      setIsLoading(false);
    });
  }, [mainnetAddress, account]);

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
  account?: string
): Promise<ResolvedDataType> => {
  const config = getConfig();
  const hubPool = config.getHubPool();
  const acceleratingDistributor = config.getAcceleratingDistributor();
  // Get the corresponding LP token from the hub pool directly
  const { lpToken: lpTokenAddress } = await hubPool.pooledTokens(tokenAddress);
  // Resolve the ACX reward token address from the AcceleratingDistributor
  const acrossTokenAddress =
    (await acceleratingDistributor.rewardToken()) as string;
  // Check information about this LP token on the AcceleratingDistributor contract
  const {
    enabled: poolEnabled,
    cumulativeStaked,
    maxMultiplier,
  } = (await acceleratingDistributor.stakingTokens(lpTokenAddress)) as {
    enabled: boolean;
    baseEmissionRate: BigNumber;
    maxMultiplier: BigNumber;
    cumulativeStaked: BigNumber;
  };
  // Resolve the provided account's outstanding rewards (if an account is connected)
  let outstandingRewards: BigNumberish = !!account
    ? await acceleratingDistributor.getOutstandingRewards(
        lpTokenAddress,
        account
      )
    : "0";
  return {
    lpTokenAddress,
    acrossTokenAddress,
    poolEnabled,
    cumulativeStaked,
    maxMultiplier,
    outstandingRewards,
  };
};
