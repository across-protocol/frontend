import { API } from "bnc-notify";
import { Signer } from "ethers";
import { useConnection, useStakingPool } from "hooks";
import { useMutation } from "react-query";
import { getConfig, notificationEmitter } from "utils";

export function useClaimStakeRewardAction(tokenAddress?: string) {
  const { signer, notify } = useConnection();
  const stakingPoolQuery = useStakingPool(tokenAddress);

  const claimStakeRewardFn = async () => {
    if (stakingPoolQuery.data && signer && tokenAddress) {
      const { lpTokenAddress } = stakingPoolQuery.data;
      await performClaimingActionBuilderFn(lpTokenAddress, signer, notify)();
    }
  };
  return useMutation(claimStakeRewardFn, {
    onSuccess: () => stakingPoolQuery.refetch(),
  });
}

/**
 * A function builder which returns a closure of a function that can be used to claim rewards with the AcceleratingDistributor contract
 * @param lpTokenAddress The ERC20 address of the LP Token
 * @param signer A valid ethers signer
 * @param notify A BNC notification API that will be used to visually notify the user of a successful/rejected transaction
 * @returns A closure function that is designed to stake or unstake a given LP token with the AcceleratingDistributor contract
 */
const performClaimingActionBuilderFn = (
  lpTokenAddress: string,
  signer: Signer,
  notify: API
) => {
  /**
   * Enables the user to claim their rewards from the ACX AcceleratingDistributor
   */
  const closure = async (): Promise<void> => {
    // Instantiate a contract instance of the AcceleratingDistributor with the user's signer
    const acceleratingDistributor =
      getConfig().getAcceleratingDistributor(signer);
    // Attempt to request a reward withdrawl via the AcceleratingDistributor contract
    const resultingTx = await acceleratingDistributor.withdrawReward(
      lpTokenAddress
    );
    // Send this to onboard's notify API to track the TX
    await notificationEmitter(resultingTx.hash, notify, 0);
  };
  // Return the closure completing the function's scope
  return closure;
};
