import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { utils } from "ethers";

import { QUERIESV2, trackMaxButtonClicked, getConfig } from "utils";
import { useStakingPool, useAmplitude } from "hooks";
import { useBalance } from "hooks/useBalance_new";
import { Text, AmountInput } from "components";

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

const config = getConfig();

export function ActionInputBlock({ action, selectedToken }: Props) {
  const [amount, setAmount] = useState("");

  const stakingPoolQuery = useStakingPool(selectedToken.l1TokenAddress);
  const maxAmountsQuery = useMaxAmounts(
    selectedToken.l1TokenAddress,
    selectedToken.symbol
  );
  const balanceQuery = useBalance(
    selectedToken.symbol,
    config.getHubPoolChainId()
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

  const { addToAmpliQueue } = useAmplitude();

  // Reset amount input and mutation state when switching actions or tokens
  useEffect(() => {
    addLiquidityMutation.reset();
    removeLiquidityMutation.reset();
    setAmount("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, selectedToken.symbol]);

  const handleAction = async () => {
    if (!maxAmountsQuery.data || !stakingPoolQuery.data) {
      return;
    }

    const { maxAddableAmount, maxRemovableAmount, maxRemovableAmountInLP } =
      maxAmountsQuery.data;

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
          maxRemovableAmountInLP,
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
    addLiquidityMutation.isPending ||
    removeLiquidityMutation.isPending;

  const disableAction = Boolean(
    disableInputs ||
      amountValidationError ||
      !amount ||
      !maxAmountsQuery.data ||
      !stakingPoolQuery.data
  );

  const maxAmount =
    selectedToken.decimals && maxAmountsQuery.data
      ? utils.formatUnits(
          action === "add"
            ? maxAmountsQuery.data.maxAddableAmount
            : maxAmountsQuery.data.maxRemovableAmount,
          selectedToken.decimals
        )
      : undefined;

  return (
    <Wrapper>
      <InputRow>
        <AmountInput
          balance={balanceQuery.balance}
          displayBalance={action === "add"}
          amountInput={amount}
          onChangeAmountInput={(input) => setAmount(input)}
          onClickMaxBalance={() => {
            if (!maxAmount) {
              return;
            }
            setAmount(maxAmount);
            addToAmpliQueue(() => {
              trackMaxButtonClicked(
                action === "add" ? "addLiquidityForm" : "removeLiquidityForm"
              );
            });
          }}
          validationError={amountValidationError}
          inputTokenSymbol={selectedToken.symbol}
          disableInput={disableInputs}
          disableMaxButton={!maxAmount}
        />

        <ButtonWrapper>
          <Button
            size="lg"
            onClick={handleAction}
            backgroundColor={action === "remove" ? "yellow" : "aqua"}
            disabled={disableAction}
            data-cy={action === "add" ? "add-button" : "remove-button"}
          >
            <Text color="dark-grey" weight={500}>
              {action === "add"
                ? addLiquidityMutation.isPending
                  ? "Adding liquidity..."
                  : "Add liquidity"
                : removeLiquidityMutation.isPending
                  ? "Removing liquidity..."
                  : "Remove liquidity"}
            </Text>
          </Button>
        </ButtonWrapper>
      </InputRow>
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
  flex-direction: column;
  align-items: center;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    gap: 12px;
  }
`;

const ButtonWrapper = styled.div`
  width: 100%;
`;
