import { LayoutV2 } from "components";
import styled from "@emotion/styled";
import { InputForm } from "./components/InputForm";
import { ConfirmationButton } from "./components/ConfirmationButton";
import { useSwapAndBridge } from "./hooks/useSwapAndBridge";

export default function SwapAndBridge() {
  const {
    inputToken,
    outputToken,
    setInputToken,
    setOutputToken,
    amount,
    setAmount,
    isAmountOrigin,
    setIsAmountOrigin,
    swapQuote,
    isQuoteLoading,
    expectedInputAmount,
    expectedOutputAmount,
    validationError,
    buttonState,
    buttonDisabled,
    buttonLoading,
    buttonLabel,
    onConfirm,
    destinationChainEcosystem,
    toAccountManagement,
  } = useSwapAndBridge();

  return (
    <LayoutV2 maxWidth={600}>
      <Wrapper>
        <InputForm
          inputToken={inputToken}
          setInputToken={setInputToken}
          outputToken={outputToken}
          setOutputToken={setOutputToken}
          setAmount={setAmount}
          isAmountOrigin={isAmountOrigin}
          setIsAmountOrigin={setIsAmountOrigin}
          isQuoteLoading={isQuoteLoading}
          expectedOutputAmount={expectedOutputAmount}
          expectedInputAmount={expectedInputAmount}
          validationError={validationError}
          destinationChainEcosystem={destinationChainEcosystem}
          toAccountManagement={toAccountManagement}
        />
        <ConfirmationButton
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapQuote || null}
          isQuoteLoading={isQuoteLoading}
          onConfirm={onConfirm}
          buttonState={buttonState}
          buttonDisabled={buttonDisabled}
          buttonLoading={buttonLoading}
          buttonLabel={buttonLabel}
        />
      </Wrapper>
    </LayoutV2>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;

  gap: 8px;

  align-items: center;
  justify-content: center;

  width: 100%;

  padding-top: 64px;
`;
