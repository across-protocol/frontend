import { LayoutV2 } from "components";
import styled from "@emotion/styled";
import { InputForm } from "./components/InputForm";
import { ConfirmationButton } from "./components/ConfirmationButton";
import { useSwapAndBridge } from "./hooks/useSwapAndBridge";
import { useQuoteRequest } from "./hooks/useQuoteReqest/useQuoteRequest";
import { EnrichedToken } from "./components/ChainTokenSelector/ChainTokenSelectorModal";
import { BigNumber } from "ethers";

export default function SwapAndBridge() {
  const { quoteRequest, dispatchQuoteRequestAction } = useQuoteRequest();

  const setInputToken: (token: EnrichedToken | null) => void = (
    token: EnrichedToken | null
  ) =>
    dispatchQuoteRequestAction({
      type: "SET_ORIGIN_TOKEN",
      payload: token,
    });

  const setOutputToken = (token: EnrichedToken | null) =>
    dispatchQuoteRequestAction({
      type: "SET_DESTINATION_TOKEN",
      payload: token,
    });

  const setAmount = (amount: BigNumber | null) =>
    isAmountOrigin
      ? dispatchQuoteRequestAction({
          type: "SET_ORIGIN_AMOUNT",
          payload: amount,
        })
      : dispatchQuoteRequestAction({
          type: "SET_DESTINATION_AMOUNT",
          payload: amount,
        });

  const {
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
  } = useSwapAndBridge(quoteRequest, setInputToken, setOutputToken);

  return (
    <LayoutV2 maxWidth={600}>
      <Wrapper>
        <InputForm
          inputToken={quoteRequest.originToken}
          setInputToken={setInputToken}
          outputToken={quoteRequest.destinationToken}
          setOutputToken={setOutputToken}
          setAmount={setAmount}
          isAmountOrigin={quoteRequest.tradeType === "exactInput"}
          setIsAmountOrigin={setIsAmountOrigin}
          isQuoteLoading={isQuoteLoading}
          expectedOutputAmount={expectedOutputAmount}
          expectedInputAmount={expectedInputAmount}
          validationError={validationError}
          destinationChainEcosystem={destinationChainEcosystem}
          toAccountManagement={toAccountManagement}
        />
        <ConfirmationButton
          inputToken={quoteRequest.originToken}
          outputToken={quoteRequest.destinationToken}
          amount={quoteRequest.amount}
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
