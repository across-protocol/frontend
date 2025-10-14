import { LayoutV2 } from "components";
import styled from "@emotion/styled";
import { useCallback } from "react";
import { InputForm } from "./components/InputForm";
import ConfirmationButton from "./components/ConfirmationButton";
import { useHistory } from "react-router-dom";
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
    onConfirm,
    validationError,
    validationWarning,
    validationErrorFormatted,
    buttonState,
    buttonDisabled,
    buttonLoading,
    buttonLabel,
  } = useSwapAndBridge();
  const history = useHistory();

  // Handle confirmation (placeholder for now)
  const handleConfirm = useCallback(async () => {
    const txHash = await onConfirm();
    history.push(
      `/bridge/${txHash}?originChainId=${inputToken?.chainId}&destinationChainId=${outputToken?.chainId}&inputTokenSymbol=${inputToken?.symbol}&outputTokenSymbol=${outputToken?.symbol}&referrer=`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onConfirm, inputToken, outputToken]);

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
        />
        <ConfirmationButton
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapQuote || null}
          isQuoteLoading={isQuoteLoading}
          onConfirm={handleConfirm}
          validationError={validationError}
          validationWarning={validationWarning}
          validationErrorFormatted={validationErrorFormatted}
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

  gap: 16px;

  align-items: center;
  justify-content: center;

  width: 100%;

  padding-top: 64px;
`;
