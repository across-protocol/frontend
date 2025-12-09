import { LayoutV2 } from "components";
import styled from "@emotion/styled";
import { InputForm } from "./components/InputForm";
import {
  QuoteRequestProvider,
  useQuoteRequestContext,
} from "./hooks/useQuoteRequest/QuoteRequestContext";
import { ConfirmationButton } from "./components/Confirmation/ConfirmationButton";
import { useMemo } from "react";
import useSwapQuote from "./hooks/useSwapQuote";
import { useDefaultRoute } from "./hooks/useDefaultRoute";

function SwapAndBridgeContent() {
  const { quoteRequest, setOriginToken, setDestinationToken } =
    useQuoteRequestContext();
  useDefaultRoute(setOriginToken, setDestinationToken);

  const { swapQuote, quoteError, isQuoteLoading } = useSwapQuote(quoteRequest);

  const expectedInputAmount = useMemo(() => {
    return swapQuote?.inputAmount;
  }, [swapQuote]);
  const expectedOutputAmount = useMemo(() => {
    return swapQuote?.expectedOutputAmount;
  }, [swapQuote]);

  return (
    <Wrapper>
      <InputForm
        expectedInputAmount={expectedInputAmount}
        expectedOutputAmount={expectedOutputAmount}
        isQuoteLoading={isQuoteLoading}
      />
      <ConfirmationButton
        isQuoteLoading={isQuoteLoading}
        quoteError={quoteError}
        swapQuote={swapQuote}
      />
    </Wrapper>
  );
}

export default function SwapAndBridge() {
  return (
    <LayoutV2 maxWidth={600}>
      <QuoteRequestProvider>
        <SwapAndBridgeContent />
      </QuoteRequestProvider>
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
