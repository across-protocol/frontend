import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { BigNumber, utils } from "ethers";

import { QUERIESV2, trackMaxButtonClicked } from "utils";
import { useStakingPool, useAmplitude } from "hooks";
import { InputWithMaxButton, Text } from "components";

import {
  useAddLiquidity,
  useRemoveLiquidity,
  useAddAndBridge,
} from "../hooks/useLiquidityAction";
import { useMaxAmounts } from "../hooks/useMaxAmounts";
import { useValidAmount } from "../hooks/useValidAmount";

import { Button } from "../LiquidityPool.styles";
import { useBridgeAction } from "views/Bridge/hooks/useBridgeAction";
import { useTransferQuote } from "views/Bridge/hooks/useTransferQuote";
import { parseAndValidateAmountInput } from "../utils";

type Props = {
  selectedToken: {
    l1TokenAddress: string;
    symbol: string;
    decimals: number;
  };
  action: "add" | "remove";
  selectedRoute: {
    l1TokenAddress: string;
    fromChain: number;
    toChain: number;
    fromTokenAddress: string;
    fromSpokeAddress: string;
    fromTokenSymbol: string;
    isNative: boolean;
  };
};

export function ActionInputBlock({
  action,
  selectedToken,
  selectedRoute,
}: Props) {
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
  const addAndBridgeMutation = useAddAndBridge(
    selectedRoute.fromChain,
    selectedRoute,
    amount,
    selectedToken.decimals,
    selectedToken.symbol,
    selectedRoute.fromTokenAddress,
    selectedToken.symbol === "ETH"
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
      if (selectedRoute.fromChain === 1) {
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
        addAndBridgeMutation().then(() => setAmount(""));
      }
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
    addLiquidityMutation.isLoading ||
    removeLiquidityMutation.isLoading;

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
            addToAmpliQueue(() => {
              trackMaxButtonClicked(
                action === "add" ? "addLiquidityForm" : "removeLiquidityForm"
              );
            });
          }}
          maxValue={maxAmountsQuery.isLoading ? "" : maxAmount}
          disableTokenIcon
        />

        <ButtonWrapper>
          <Button
            size="lg"
            onClick={handleAction}
            isRemove={action === "remove"}
            disabled={disableAction}
            data-cy={action === "add" ? "add-button" : "remove-button"}
          >
            <Text color="dark-grey" weight={500}>
              {action === "add"
                ? addLiquidityMutation.isLoading
                  ? "Adding liquidity..."
                  : selectedRoute.fromChain === 1
                  ? "Add liquidity"
                  : "Add and Stake"
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
