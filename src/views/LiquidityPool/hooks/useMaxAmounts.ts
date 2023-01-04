import { useQuery } from "react-query";
import { BigNumber, utils } from "ethers";

import { useConnection, useStakingPool } from "hooks";
import { estimateGasForAddEthLiquidity, max } from "utils";

import { useUserLiquidityPool } from "./useUserLiquidityPool";

export function useMaxAmounts(selectedTokenAddress?: string) {
  const { signer } = useConnection();
  const stakingPoolQuery = useStakingPool(selectedTokenAddress);
  const userLiquidityPoolQuery = useUserLiquidityPool(
    stakingPoolQuery.data?.tokenSymbol
  );

  return useQuery(
    [
      "max-lp-amounts",
      selectedTokenAddress,
      userLiquidityPoolQuery.data?.l1Balance.toString(),
    ],
    async () => {
      let maxAddableAmount: BigNumber;
      let maxRemovableAmount: BigNumber;

      if (
        selectedTokenAddress &&
        stakingPoolQuery.data &&
        userLiquidityPoolQuery.data &&
        signer
      ) {
        const { l1Balance } = userLiquidityPoolQuery.data;
        maxAddableAmount =
          stakingPoolQuery.data.tokenSymbol !== "ETH"
            ? l1Balance
            : // For ETH, we need to take the gas costs into account before setting the max. addable amount
              await estimateGasForAddEthLiquidity(
                signer,
                selectedTokenAddress,
                l1Balance
              )
                .then((estimatedGasCosts) =>
                  max(l1Balance.sub(estimatedGasCosts), 0)
                )
                .catch((err) =>
                  max(l1Balance.sub(utils.parseEther("0.0001")), 0)
                );
        maxRemovableAmount = max(
          BigNumber.from(userLiquidityPoolQuery.data.positionValue).sub(
            stakingPoolQuery.data.convertLPToUnderlying(
              stakingPoolQuery.data.userAmountOfLPStaked
            )
          ),
          0
        );
      } else {
        maxAddableAmount = BigNumber.from(0);
        maxRemovableAmount = BigNumber.from(0);
      }

      return {
        maxAddableAmount,
        maxRemovableAmount,
      };
    },
    {
      enabled: Boolean(
        selectedTokenAddress &&
          stakingPoolQuery.data &&
          userLiquidityPoolQuery.data &&
          signer
      ),
    }
  );
}
