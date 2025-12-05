import { LayoutV2 } from "components";
import styled from "@emotion/styled";
import { InputForm } from "./components/InputForm";
import {
  QuoteRequestProvider,
  useQuoteRequestContext,
} from "./hooks/useQuoteRequest/QuoteRequestContext";
import { useDefaultRouteInQuote } from "./hooks/useQuoteRequest/useDefaultRouteInQuote";
import { ConfirmationButton } from "./components/Confirmation/ConfirmationButton";
import { useMemo } from "react";
import { useEcosystemAccounts } from "../../hooks/useEcosystemAccounts";
import useSwapQuote from "./hooks/useSwapQuote";
import { useSwapApprovalAction } from "./hooks/useSwapApprovalAction";
import { useOnConfirm } from "./hooks/useOnConfirm";
import { useValidateSwapAndBridge } from "./hooks/useValidateSwapAndBridge";
import { useButtonState } from "./hooks/useButtonState";

function SwapAndBridgeContent() {
  const { quoteRequest } = useQuoteRequestContext();
  useDefaultRouteInQuote();

  const { depositor } = useEcosystemAccounts({
    originToken: quoteRequest.originToken,
    destinationToken: quoteRequest.destinationToken,
    customDestinationAccount: quoteRequest.customDestinationAccount,
  });
  const { swapQuote, quoteError, isQuoteLoading } = useSwapQuote(quoteRequest);

  const approvalAction = useSwapApprovalAction(
    quoteRequest.originToken?.chainId || 0,
    swapQuote
  );

  const onConfirm = useOnConfirm(quoteRequest, approvalAction);

  const validation = useValidateSwapAndBridge(
    quoteRequest.amount,
    quoteRequest.tradeType === "exactInput",
    quoteRequest.originToken,
    quoteRequest.destinationToken,
    !!depositor,
    swapQuote?.inputAmount
  );

  const buttonState = useButtonState(
    quoteRequest,
    approvalAction,
    validation,
    quoteError,
    isQuoteLoading
  );

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
        buttonState={buttonState}
        isQuoteLoading={isQuoteLoading}
        onConfirm={onConfirm}
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
