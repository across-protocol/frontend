import { StakingPool } from "hooks";
import { useEffect, useState } from "react";
import { deriveNewStakingValues, isNumberEthersParseable } from "utils";

export function useStakeFormLogic(
  poolData: StakingPool,
  poolDataLoading: boolean
) {
  const [stakingAction, setStakingAction] = useState<"stake" | "unstake">(
    "stake"
  );
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [validAmount, setValidAmount] = useState(true);

  useEffect(() => {
    setAmount(undefined);
    setValidAmount(true);
  }, [stakingAction]);

  useEffect(() => {
    const isStaked = stakingAction === "stake";
    if (!poolDataLoading) {
      if (amount) {
        if (isNumberEthersParseable(amount)) {
          const asNumeric = poolData.lpTokenParser(amount);
          if (asNumeric.lt(0)) {
            setValidAmount(false);
          } else if (asNumeric.gt(0)) {
            const maximum = isStaked
              ? poolData.availableLPTokenBalance
              : poolData.userAmountOfLPStaked;
            setValidAmount(asNumeric.lte(maximum));
          } else {
            setValidAmount(true);
          }
        } else {
          setValidAmount(false);
        }
      }
    }
  }, [amount, poolData, poolDataLoading, stakingAction]);

  const modifiedPoolData =
    !poolDataLoading && amount && validAmount && isNumberEthersParseable(amount)
      ? deriveNewStakingValues(
          poolData,
          poolData.lpTokenParser(amount),
          stakingAction
        ) ?? poolData
      : poolData;

  const maximumValue =
    stakingAction === "stake"
      ? poolData.availableLPTokenBalance
      : poolData.userAmountOfLPStaked;

  return {
    stakingAction,
    setStakingAction,
    amount,
    setAmount,
    isAmountValid: validAmount,
    originPoolData: poolData,
    updatedPoolData: modifiedPoolData,
    maximumValue,
  };
}
