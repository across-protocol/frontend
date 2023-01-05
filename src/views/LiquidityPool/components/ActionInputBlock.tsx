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
  selectedToken: {
    l1TokenAddress: string;
    symbol: string;
    decimals: number;
  };
  action: "add" | "remove";
};

export function ActionInputBlock({ action, selectedToken }: Props) {
  const [amount, setAmount] = useState("");

  const stakingPoolQuery = useStakingPool(selectedToken.l1TokenAddress);
  const maxAmountsQuery = useMaxAmounts(
    selectedToken.l1TokenAddress,
    selectedToken.symbol
  );

  const addLiquidityMutation = useAddLiquidity(
    selectedToken.symbol,
    selectedToken.l1TokenAddress
  );
  const removeLiquidityMutation = useRemoveLiquidity(
    selectedToken.symbol,
    selectedToken.l1TokenAddress
  );

  const { amountValidationError } = useValidAmount(
    action,
    amount,
    selectedToken.decimals,
    maxAmountsQuery.data
  );

  // Reset amount input and mutation state when switching actions or tokens
  useEffect(() => {
    addLiquidityMutation.reset();
    removeLiquidityMutation.reset();
    setAmount("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, selectedToken.symbol]);

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
          onSuccess: () => {
            setAmount("");
            maxAmountsQuery.refetch();
          },
        }
      );
    } else {
      removeLiquidityMutation.mutate(
        {
          amountInput: amount,
          maxRemovableAmount,
        },
        {
          onSuccess: () => {
            setAmount("");
            maxAmountsQuery.refetch();
          },
        }
      );
    }
  };

  const disableInputs =
    stakingPoolQuery.isLoading ||
    addLiquidityMutation.isLoading ||
    removeLiquidityMutation.isLoading;

  const maxAmount =
    selectedToken.decimals && maxAmountsQuery.data
      ? utils.formatUnits(
          action === "add"
            ? maxAmountsQuery.data.maxAddableAmount
            : maxAmountsQuery.data.maxRemovableAmount,
          selectedToken.decimals
        )
      : "0";

  return (
    <Wrapper>
      <InputRow>
        <InputWithMaxButton
          valid={false}
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
            <Text color="dark-grey" weight={500}>
              {action === "add"
                ? addLiquidityMutation.isLoading
                  ? "Adding liquidity..."
                  : "Add liquidity"
                : removeLiquidityMutation.isLoading
                ? "Removing liquidity..."
                : "Remove liquidity"}
            </Text>
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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const InputRow = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: row;
  align-items: center;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    gap: 12px;
  }
`;

const ButtonWrapper = styled.div`
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
