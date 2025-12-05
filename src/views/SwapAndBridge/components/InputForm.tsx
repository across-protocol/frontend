import { COLORS } from "utils";
import styled from "@emotion/styled";
import { useState } from "react";
import { ReactComponent as ArrowDown } from "assets/icons/arrow-down.svg";
import { AmountInputError } from "views/Bridge/utils";
import { UnitType } from "hooks";
import { useQuoteRequestContext } from "../hooks/useQuoteRequest/QuoteRequestContext";
import { DestinationTokenDisplay, OriginTokenInput } from "./TokenInput";

export const InputForm = ({
  isQuoteLoading,
  expectedOutputAmount,
  expectedInputAmount,
  validationError,
}: {
  isQuoteLoading: boolean;
  expectedOutputAmount: string | undefined;
  expectedInputAmount: string | undefined;
  validationError: AmountInputError | undefined;
}) => {
  const { quickSwap } = useQuoteRequestContext();
  const [unit, setUnit] = useState<UnitType>("token");

  return (
    <Wrapper>
      <OriginTokenInput
        expectedAmount={expectedInputAmount}
        isUpdateLoading={isQuoteLoading}
        insufficientBalance={
          validationError === AmountInputError.INSUFFICIENT_BALANCE
        }
        unit={unit}
        setUnit={setUnit}
      />
      <QuickSwapButton onClick={quickSwap}>
        <ArrowDown width="20px" height="20px" />
      </QuickSwapButton>
      <DestinationTokenDisplay
        expectedOutputAmount={expectedOutputAmount}
        isUpdateLoading={isQuoteLoading}
        unit={unit}
        setUnit={setUnit}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  align-self: stretch;
`;

const QuickSwapButton = styled.button`
  display: flex;
  width: 46px;
  height: 38px;
  position: absolute;
  left: calc(50% - 20px);
  top: calc(50% - 16px);
  justify-content: center;
  align-items: center;
  background: ${COLORS["black-700"]};
  border: 3px solid ${COLORS["black-800"]};
  border-radius: 15px;
  z-index: 4;
  cursor: pointer;

  & * {
    flex-shrink: 0;
  }

  &:hover {
    svg {
      color: white;
    }
  }
`;
