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
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [isAmountInvalid, setIsAmountInvalid] = useState(false);

  useEffect(() => {
    setAmount(undefined);
    setIsAmountValid(false);
    setIsAmountInvalid(false);
  }, [stakingAction]);

  useEffect(() => {
    const isStaked = stakingAction === "stake";
    if (!poolDataLoading) {
      setIsAmountValid(false);
      setIsAmountInvalid(false);
      if (amount && amount !== ".") {
        if (isNumberEthersParseable(amount)) {
          const asNumeric = poolData.lpTokenParser(amount);
          if (asNumeric.lt(0)) {
            setIsAmountInvalid(true);
          } else if (asNumeric.gt(0)) {
            const maximum = isStaked
              ? poolData.availableLPTokenBalance
              : poolData.userAmountOfLPStaked;
            setIsAmountValid(asNumeric.lte(maximum));
            setIsAmountInvalid(asNumeric.gt(maximum));
          }
        } else {
          setIsAmountInvalid(true);
        }
      }
    }
  }, [amount, poolData, poolDataLoading, stakingAction]);

  const modifiedPoolData =
    !poolDataLoading &&
    amount &&
    isAmountValid &&
    isNumberEthersParseable(amount)
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
    isAmountValid,
    isAmountInvalid,
    originPoolData: poolData,
    updatedPoolData: modifiedPoolData,
    maximumValue,
  };
}
