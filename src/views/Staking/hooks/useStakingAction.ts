import { useMutation } from "react-query";
import { BigNumber, Signer } from "ethers";
import { ERC20__factory } from "@across-protocol/contracts-v2";
import { API } from "bnc-notify";

import { useConnection } from "hooks";
import { getConfig, MAX_APPROVAL_AMOUNT, notificationEmitter } from "utils";

import { useStakingPool } from "./useStakingPool";

export type StakingActionFunctionArgs = { amount: BigNumber };
export type StakingActionFunctionType = (
  args: StakingActionFunctionArgs
) => Promise<void>;

export function useStakeAction(tokenAddress?: string) {
  const { signer, notify } = useConnection();
  const stakingPoolQuery = useStakingPool(tokenAddress);

  const stakeActionFn: StakingActionFunctionType = async (
    args: StakingActionFunctionArgs
  ) => {
    if (stakingPoolQuery.data && signer && tokenAddress) {
      const { lpTokenAddress, requiresApproval } = stakingPoolQuery.data;
      performStakingActionBuilderFn(
        lpTokenAddress,
        signer,
        "stake",
        requiresApproval,
        notify
      )(args.amount);
    }
  };
  return useMutation(stakeActionFn, {
    onSuccess: () => stakingPoolQuery.refetch(),
  });
}

export function useUnstakeAction(tokenAddress?: string) {
  const { signer, notify } = useConnection();
  const stakingPoolQuery = useStakingPool(tokenAddress);

  const unstakeActionFn: StakingActionFunctionType = async (
    args: StakingActionFunctionArgs
  ) => {
    if (stakingPoolQuery.data && signer && tokenAddress) {
      const { lpTokenAddress, requiresApproval } = stakingPoolQuery.data;
      performStakingActionBuilderFn(
        lpTokenAddress,
        signer,
        "unstake",
        requiresApproval,
        notify
      )(args.amount);
    }
  };
  return useMutation(unstakeActionFn, {
    onSuccess: () => stakingPoolQuery.refetch(),
  });
}

/**
 * A function builder which returns a closure of a function that can be used to stake/unstake with the AcceleratingDistributor contract
 * @param lpTokenAddress The ERC20 address of the LP Token
 * @param signer A valid ethers signer
 * @param action The action that will build this function. Either 'stake' or 'unstake'
 * @param requiresApproval Whether or not this function will first attempt have the user set an allowance with the AcceleratingDistributor contract
 * @param notify A BNC notification API that will be used to visually notify the user of a successful/rejected transaction
 * @returns A closure function that is designed to stake or unstake a given LP token with the AcceleratingDistributor contract
 */
const performStakingActionBuilderFn = (
  lpTokenAddress: string,
  signer: Signer,
  action: "stake" | "unstake",
  requiresApproval: boolean,
  notify: API
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
   */
  const closure = async (amount: BigNumber): Promise<void> => {
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

    // Call the generate the transaction to stake/unstake and
    // wait until the tx has been resolved
    const result = await callingFn(lpTokenAddress, amountAsBigNumber);
    await notificationEmitter(result.hash, notify);
  };
  return closure;
};
