import { useQuery } from "react-query";
import { BigNumber, utils } from "ethers";

import { useConnection, useStakingPool } from "hooks";
import { estimateGasForAddEthLiquidity, max } from "utils";

import { useUserLiquidityPool } from "./useUserLiquidityPool";

export function useMaxAmounts(
  selectedTokenAddress?: string,
  selectedTokenSymbol?: string
) {
  const { signer } = useConnection();
  const stakingPoolQuery = useStakingPool(selectedTokenAddress);
  const userLiquidityPoolQuery = useUserLiquidityPool(selectedTokenSymbol);

  return useQuery(
    [
      "max-lp-amounts",
      selectedTokenSymbol,
      userLiquidityPoolQuery.data?.l1Balance.toString(),
      userLiquidityPoolQuery.data?.positionValue.toString(),
    ],
    async () => {
      let maxAddableAmount: BigNumber;
      let maxRemovableAmount: BigNumber;
      let maxRemovableAmountInLP: BigNumber;

      if (
        selectedTokenAddress &&
        selectedTokenSymbol &&
        stakingPoolQuery.data &&
        userLiquidityPoolQuery.data &&
        signer
      ) {
        const { l1Balance } = userLiquidityPoolQuery.data;
        maxAddableAmount =
          "ETH" !== selectedTokenSymbol
            ? l1Balance
            : // For ETH, we need to take the gas costs into account before setting the max. addable amount
              await estimateGasForAddEthLiquidity(signer, selectedTokenAddress)
                .then((estimatedGasCosts) =>
                  max(l1Balance.sub(estimatedGasCosts), 0)
                )
                .catch((err) =>
                  max(l1Balance.sub(utils.parseEther("0.01")), 0)
                );
        maxRemovableAmountInLP = BigNumber.from(
          userLiquidityPoolQuery.data.lpTokens
        );
        maxRemovableAmount = stakingPoolQuery.data.convertLPToUnderlying(
          maxRemovableAmountInLP
        );
      } else {
        maxAddableAmount = BigNumber.from(0);
        maxRemovableAmount = BigNumber.from(0);
        maxRemovableAmountInLP = BigNumber.from(0);
      }

      return {
        maxAddableAmount,
        maxRemovableAmount,
        maxRemovableAmountInLP,
      };
    },
    {
      enabled: Boolean(
        selectedTokenSymbol &&
          selectedTokenAddress &&
          stakingPoolQuery.data &&
          userLiquidityPoolQuery.data &&
          signer
      ),
    }
  );
}
