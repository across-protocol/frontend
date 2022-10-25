import { useConnection } from "hooks";
import { useEffect, useState } from "react";
import {
  fixedPointAdjustment,
  formattedBigNumberToNumber,
  formatUnitsFnBuilder,
  getConfig,
  hubPoolChainId,
  MAX_APPROVAL_AMOUNT,
  parseEtherLike,
  safeDivide,
  switchChain,
  toWeiSafe,
  notificationEmitter,
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

export const useStakingActionsResolver = () => {
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
 * Calls on-chain data & the ACX API to resolve information about the AcceleratingDistributor Contract
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
  const usersMultiplierPercentage = formattedBigNumberToNumber(
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

  // Call the closure function twice to create customized functions for
  // staking and unstaking against the AcceleratingDistributor contract

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

/**
 * A function builder which returns a closure of a function that can be used to stake/unstake with the AcceleratingDistributor contract
 * @param lpTokenAddress The ERC20 address of the LP Token
 * @param signer A valid ethers signer
 * @param action The action that will build this function. Either 'stake' or 'unstake'
 * @param requiresApproval Whether or not this function will first attempt have the user set an allowance with the AcceleratingDistributor contract
 * @param notify A BNC notification API that will be used to visually notify the user of a successful/rejected transaction
 * @param setReloadData A React dispatch function which signals to React to regenerate the staking information extracted from on-chain / api sources
 * @returns A closure function that is designed to stake or unstake a given LP token with the AcceleratingDistributor contract
 */
const performStakingActionBuilderFn = (
  lpTokenAddress: string,
  signer: Signer,
  action: "stake" | "unstake",
  requiresApproval: boolean,
  notify: API,
  setReloadData: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // The purpose of this variable is to keep track of whether or not
  // the closure needs to request approval from the ERC20 token to be
  // used within the AcceleratingDistributor contract. This allows us
  // to stake/unstake multiple times without needing to directly refresh
  // to determine if approval is required anymore
  let innerApprovalRequired = requiresApproval;

  /**
   * Enables the user to stake/unstake with the AcceleratingDistributor contract
   * @param amount The amount of LP tokens to either stake or unstake
   * @param setTransition A React Dispatch function that sets whether a `boolean` transition state is active or not
   * @param isRelevantComponentRendered A reference to whether the component that is calling this function is still rendered
   */
  const closure = async (
    amount: BigNumber,
    setTransition: React.Dispatch<React.SetStateAction<boolean>>,
    isRelevantComponentRendered: React.MutableRefObject<boolean>
  ): Promise<void> => {
    try {
      // Ensure that this component is still rendered
      // and set the `inTransition` stake from the calling component
      // to `true`
      if (isRelevantComponentRendered.current) {
        setTransition(true);
      }
      // Resolve the AcceleratingDistributor and connect it with
      // the signer to execute transactions on behalf of the wallet
      // holder
      const acceleratingDistributor = getConfig()
        .getAcceleratingDistributor()
        .connect(signer);
      // Check if this wallet has permissions to interract with the
      // AcceleratingDistibutor function regarding staking/unstaking
      // with the provided LP Token
      if (innerApprovalRequired) {
        const lpER20 = ERC20__factory.connect(lpTokenAddress, signer);
        const approvalResult = await lpER20.approve(
          acceleratingDistributor.address,
          MAX_APPROVAL_AMOUNT
        );
        // Wait for the transaction to return successful
        await notificationEmitter(approvalResult.hash, notify);
        innerApprovalRequired = false;
      }
      const callingFn = acceleratingDistributor[action];
      const amountAsBigNumber = BigNumber.from(amount);
      // Ensure that the user is within the rendered function
      // before executing this stake command
      if (isRelevantComponentRendered.current) {
        // Call the generate the transaction to stake/unstake and
        // wait until the tx has been resolved
        const result = await callingFn(lpTokenAddress, amountAsBigNumber);
        await notificationEmitter(result.hash, notify);
      }
    } catch (e) {
      console.log(e);
    } finally {
      // No matter what, attempt to set the transition to false
      // for the calling component and also allow the user to
      // reload the data so that the user's interraction with the
      // contract is visually displayed
      if (isRelevantComponentRendered.current) {
        setTransition(false);
        setReloadData((data) => !data);
      }
    }
  };
  return closure;
};
