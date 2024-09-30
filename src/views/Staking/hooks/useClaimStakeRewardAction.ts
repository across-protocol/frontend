import { Signer } from "ethers";
import { useConnection, useStakingPool } from "hooks";
import { useMutation } from "@tanstack/react-query";
import { getConfig, hubPoolChainId, waitOnTransaction } from "utils";
import { sendWithPaddedGas } from "utils/transactions";

export function useClaimStakeRewardAction(tokenAddress?: string) {
  const { signer } = useConnection();
  const stakingPoolQuery = useStakingPool(tokenAddress);

  const claimStakeRewardFn = async () => {
    if (stakingPoolQuery.data && signer && tokenAddress) {
      const { lpTokenAddress } = stakingPoolQuery.data;
      await performClaimingAction(lpTokenAddress, signer);
    }
  };
  return useMutation({
    mutationFn: claimStakeRewardFn,
    onSuccess: () => stakingPoolQuery.refetch(),
  });
}

/**
 * A function builder which returns a closure of a function that can be used to claim rewards with the AcceleratingDistributor contract
 * @param lpTokenAddress The ERC20 address of the LP Token
 * @param signer A valid ethers signer
 * @returns A closure function that is designed to stake or unstake a given LP token with the AcceleratingDistributor contract
 */
const performClaimingAction = async (
  lpTokenAddress: string,
  signer: Signer
) => {
  // Instantiate a contract instance of the AcceleratingDistributor with the user's signer
  const acceleratingDistributor =
    getConfig().getAcceleratingDistributor(signer);
  try {
    // Attempt to request a reward withdrawl via the AcceleratingDistributor contract
    const resultingTx = await sendWithPaddedGas(
      acceleratingDistributor,
      "withdrawReward"
    )(lpTokenAddress);
    await waitOnTransaction(hubPoolChainId, resultingTx, true);
  } catch (_e) {
    // We currently don't handle the error case other than to exit gracefully.
  }
};
