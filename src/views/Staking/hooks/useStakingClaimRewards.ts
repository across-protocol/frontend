import { useConnection } from "state/hooks";
import { useEffect, useState } from "react";
import {
  addEtherscan,
  BASIS_SHIFT,
  formattedBigNumberToNumber,
  formatUnitsFnBuilder,
  getConfig,
  hubPoolChainId,
  MAX_APPROVAL_AMOUNT,
  parseEther,
  parseUnitsFnBuilder,
  safeDivide,
  switchChain,
} from "utils";
import { useStakingPoolResolver } from "./useStakingPoolResolver";
import { BigNumber, BigNumberish, providers, Signer } from "ethers";
import { ERC20__factory } from "@across-protocol/contracts-v2";
import { API } from "bnc-notify";
import axios from "axios";

export type StakingActionFunctionType = (
  amount: BigNumber,
  setTransition: React.Dispatch<React.SetStateAction<boolean>>,
  isRelevantComponentRende: React.MutableRefObject<boolean>
) => Promise<void>;
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
      lpTokenFormatter: FormatterFnType;
      lpTokenParser: ParserFnType;
      stakeActionFn: StakingActionFunctionType;
      unstakeActionFn: StakingActionFunctionType;
    }
  | undefined;

export const stakingActionNOOPFn: StakingActionFunctionType = async () => {};

export const useStakingClaimRewards = () => {
  const { account, provider, signer, notify, chainId } = useConnection();
  const { mainnetAddress } = useStakingPoolResolver();

  const [isLoading, setIsLoading] = useState(false);
  const [stakingData, setStakingData] = useState<ResolvedDataType>(undefined);
  const [reloadData, setReloadData] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    if (!mainnetAddress || !provider || !account || !signer || !chainId) {
      setIsLoading(false);
    } else if (String(chainId) !== String(hubPoolChainId)) {
      setIsWrongNetwork(true);
      setIsLoading(false);
    } else {
      setIsWrongNetwork(false);
      resolveRequestedData(
        mainnetAddress,
        provider,
        signer,
        account,
        notify,
        setReloadData
      ).then((resolvedData) => {
        setStakingData(resolvedData);
        setIsLoading(false);
      });
    }
  }, [mainnetAddress, account, provider, signer, notify, reloadData, chainId]);

  const isWrongNetworkHandler = () =>
    provider && switchChain(provider, hubPoolChainId);

  return {
    isStakingDataLoading: isLoading,
    stakingData,
    isWrongNetwork,
    isWrongNetworkHandler,
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
  account: string,
  notify: API,
  setReloadData: React.Dispatch<React.SetStateAction<boolean>>
): Promise<ResolvedDataType> => {
  const config = getConfig();
  const hubPool = config.getHubPool();
  const acceleratingDistributor = config.getAcceleratingDistributor();
  const acceleratingDistributorAddress = acceleratingDistributor.address;

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
    lpTokenERC20.allowance(account, acceleratingDistributorAddress),
    Promise.resolve((await lpTokenERC20.symbol()).slice(4)),
    axios.get(`/api/pools`, {
      params: { token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    }),
  ]);

  const { estimatedApy: estimatedApyFromQuery, totalPoolSize } =
    poolQuery.data as {
      estimatedApy: string;
      totalPoolSize: BigNumberish;
    };

  // Average Deposit Time retrieves the # seconds since the last deposit, weighted
  // by all the deposits in a user's account.
  const daysElapsed = formattedBigNumberToNumber(
    averageDepositTime.mul(BASIS_SHIFT).div(86400)
  );

  const usersMultiplierPercentage = formattedBigNumberToNumber(
    currentUserRewardMultiplier.mul(BASIS_SHIFT).div(maxMultiplier).mul(100)
  );

  const usersTotalLPTokens = availableLPTokenBalance.add(userAmountOfLPStaked);

  const shareOfPool = safeDivide(
    userAmountOfLPStaked.mul(BASIS_SHIFT),
    BigNumber.from(totalPoolSize)
  ).mul(100);

  const estimatedApy = parseEther(estimatedApyFromQuery).mul(100);

  const lpTokenFormatter = formatUnitsFnBuilder(lpTokenDecimalCount);
  const lpTokenParser = parseUnitsFnBuilder(lpTokenDecimalCount);

  const requiresApproval = lpTokenAllowance.lte(availableLPTokenBalance);

  const stakeActionFn = performStakingActionBuilderFn(
    lpTokenAddress,
    signer,
    "stake",
    requiresApproval,
    notify,
    setReloadData
  );
  const unstakeActionFn = performStakingActionBuilderFn(
    lpTokenAddress,
    signer,
    "unstake",
    requiresApproval,
    notify,
    setReloadData
  );

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
    lpTokenFormatter,
    lpTokenParser,
    stakeActionFn,
    unstakeActionFn,
  };
};

const performStakingActionBuilderFn = (
  lpTokenAddress: string,
  signer: Signer,
  action: "stake" | "unstake",
  requiresApproval: boolean,
  notify: API,
  setReloadData: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // Use this inner inner local to track whether a
  // successful approavl has been emitted.
  let innerApprovalRequired = requiresApproval;
  return async (
    amount: BigNumber,
    setTransition: React.Dispatch<React.SetStateAction<boolean>>,
    isRelevantComponentRendered: React.MutableRefObject<boolean>
  ): Promise<void> => {
    try {
      if (isRelevantComponentRendered.current) {
        setTransition(true);
      }
      const acceleratingDistributor = getConfig()
        .getAcceleratingDistributor()
        .connect(signer);
      if (innerApprovalRequired) {
        const lpER20 = ERC20__factory.connect(lpTokenAddress, signer);
        const approvalResult = await lpER20.approve(
          acceleratingDistributor.address,
          MAX_APPROVAL_AMOUNT
        );
        await notificationEmitter(approvalResult.hash, notify);
        innerApprovalRequired = false;
      }
      const callingFn = acceleratingDistributor[action];
      const amountAsBigNumber = BigNumber.from(amount);
      // Ensure that the user is within the rendered function
      // before executing this stake command
      if (isRelevantComponentRendered.current) {
        const result = await callingFn(lpTokenAddress, amountAsBigNumber);
        await notificationEmitter(result.hash, notify);
      }
    } catch (e) {
      console.log(e);
    } finally {
      if (isRelevantComponentRendered.current) {
        setTransition(false);
        setReloadData((data) => !data);
      }
    }
  };
};

const notificationEmitter = async (
  txHash: string,
  notify: API
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const { emitter } = notify.hash(txHash, "5");
    emitter.on("all", addEtherscan);
    emitter.on("txConfirmed", () => {
      notify.unsubscribe(txHash);
      setTimeout(() => {
        resolve();
      }, 5000);
    });
    emitter.on("txFailed", () => {
      notify.unsubscribe(txHash);
      reject();
    });
  });
};
