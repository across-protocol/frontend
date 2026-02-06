import LayoutV2 from "components/LayoutV2";
import styled from "@emotion/styled";
import { InputForm } from "./components/InputForm";
import {
  QuoteRequestProvider,
  useQuoteRequestContext,
} from "./hooks/useQuoteRequest/QuoteRequestContext";
import { ConfirmationButton } from "./components/Confirmation/ConfirmationButton";
import { PolymarketBanner } from "./components/PolymarketBanner";
import { useMemo } from "react";
import useSwapQuote from "./hooks/useSwapQuote";
import { useDefaultRoute } from "./hooks/useDefaultRoute";
import { isReverseRouteRestricted } from "./components/ChainTokenSelector/isTokenUnreachable";

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

  const disableQuickSwap = isReverseRouteRestricted({
    originToken: quoteRequest?.originToken,
    destinationToken: quoteRequest?.destinationToken,
  });

  return (
    <Wrapper>
      <InputForm
        expectedInputAmount={expectedInputAmount}
        expectedOutputAmount={expectedOutputAmount}
        isQuoteLoading={isQuoteLoading}
        disableQuickSwap={disableQuickSwap}
      />
      <ConfirmationButton
        isQuoteLoading={isQuoteLoading}
        quoteError={quoteError}
        swapQuote={swapQuote}
      />
      <PolymarketBanner />
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
