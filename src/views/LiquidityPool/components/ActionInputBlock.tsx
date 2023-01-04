import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { utils } from "ethers";

import { QUERIESV2 } from "utils";
import { useStakingPool } from "hooks";
import { InputWithMaxButton, Text } from "components";

import {
  useAddLiquidity,
  useRemoveLiquidity,
} from "../hooks/useLiquidityAction";
import { useMaxAmounts } from "../hooks/useMaxAmounts";
import { useValidAmount } from "../hooks/useValidAmount";

import { Button } from "../LiquidityPool.styles";

type Props = {
  selectedL1TokenAddress?: string;
  selectedL1TokenDecimals?: number;
  selectedL1TokenSymbol?: string;
  action: "add" | "remove";
};

export function ActionInputBlock({
  action,
  selectedL1TokenAddress,
  selectedL1TokenDecimals,
  selectedL1TokenSymbol,
}: Props) {
  const [amount, setAmount] = useState("");

  const stakingPoolQuery = useStakingPool(selectedL1TokenAddress);
  const maxAmountsQuery = useMaxAmounts(selectedL1TokenAddress);

  const addLiquidityMutation = useAddLiquidity(
    selectedL1TokenSymbol,
    selectedL1TokenAddress
  );
  const removeLiquidityMutation = useRemoveLiquidity(
    selectedL1TokenSymbol,
    selectedL1TokenAddress
  );

  const { amountValidationError } = useValidAmount(
    action,
    amount,
    selectedL1TokenDecimals,
    maxAmountsQuery.data
  );

  // Reset amount input and mutation state when switching actions or tokens
  useEffect(() => {
    addLiquidityMutation.reset();
    removeLiquidityMutation.reset();
    setAmount("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, selectedL1TokenSymbol]);

  const handleAction = async () => {
    if (!maxAmountsQuery.data) {
      return;
    }

    const { maxAddableAmount, maxRemovableAmount } = maxAmountsQuery.data;

    if (action === "add") {
      addLiquidityMutation.mutate(
        {
          amountInput: amount,
          maxAddableAmount,
        },
        {
          onSuccess: () => setAmount(""),
        }
      );
    } else {
      removeLiquidityMutation.mutate(
        {
          amountInput: amount,
          maxRemovableAmount,
        },
        {
          onSuccess: () => setAmount(""),
        }
      );
    }
  };

  const disableInputs =
    stakingPoolQuery.isLoading ||
    addLiquidityMutation.isLoading ||
    removeLiquidityMutation.isLoading;

  const maxAmount =
    selectedL1TokenDecimals && maxAmountsQuery.data
      ? utils.formatUnits(
          action === "add"
            ? maxAmountsQuery.data.maxAddableAmount
            : maxAmountsQuery.data.maxRemovableAmount,
          selectedL1TokenDecimals
        )
      : "0";

  return (
    <Wrapper>
      <InputRow>
        <InputWithMaxButton
          valid={!amountValidationError}
          invalid={Boolean(amountValidationError)}
          value={amount}
          onChangeValue={(e) => setAmount(e.target.value)}
          disableInput={disableInputs}
          onEnterKeyDown={handleAction}
          onClickMaxButton={() => {
            setAmount(maxAmount);
          }}
          maxValue={maxAmountsQuery.isLoading ? "" : maxAmount}
          disableTokenIcon
        />

        <ButtonWrapper>
          <Button
            size="lg"
            onClick={handleAction}
            isRemove={action === "remove"}
            disabled={Boolean(disableInputs || amountValidationError)}
          >
            {action === "add"
              ? addLiquidityMutation.isLoading
                ? "Adding liquidity..."
                : "Add liquidity"
              : removeLiquidityMutation.isLoading
              ? "Removing liquidity..."
              : "Remove liquidity"}
          </Button>
        </ButtonWrapper>
      </InputRow>
      {amountValidationError && (
        <ErrorContainer>
          <Text color="error">{amountValidationError}</Text>
        </ErrorContainer>
      )}
    </Wrapper>
  );
}

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const InputRow = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: row;
  align-items: center;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    gap: 12px;
  }
`;

export const ButtonWrapper = styled.div`
  flex-shrink: 0;
  @media ${QUERIESV2.sm.andDown} {
    width: 100%;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;
