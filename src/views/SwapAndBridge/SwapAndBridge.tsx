import { LayoutV2 } from "components";
import styled from "@emotion/styled";
import { InputForm } from "./components/InputForm";
import { useQuoteRequest } from "./hooks/useQuoteRequest/useQuoteRequest";
import { EnrichedToken } from "./components/ChainTokenSelector/ChainTokenSelectorModal";
import { BigNumber } from "ethers";
import { useDefaultRouteInQuote } from "./hooks/useQuoteRequest/useDefaultRouteInQuote";
import { ConfirmationButton } from "./components/Confirmation/ConfirmationButton";
import { useMemo } from "react";
import { useEcosystemAccounts } from "../../hooks/useEcosystemAccounts";
import useSwapQuote from "./hooks/useSwapQuote";
import { useSwapApprovalAction } from "./hooks/useSwapApprovalAction";
import { useOnConfirm } from "./hooks/useOnConfirm";
import { useValidateSwapAndBridge } from "./hooks/useValidateSwapAndBridge";
import { useButtonState } from "./hooks/useButtonState";

export default function SwapAndBridge() {
  const { quoteRequest, dispatchQuoteRequestAction } = useQuoteRequest();
  useDefaultRouteInQuote(dispatchQuoteRequestAction);

  const { depositor } = useEcosystemAccounts({
    originToken: quoteRequest.originToken,
    destinationToken: quoteRequest.destinationToken,
    customDestinationAccount: quoteRequest.customDestinationAccount,
  });

  const {
    data: swapQuote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useSwapQuote(quoteRequest);

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

  const { buttonState, buttonDisabled, buttonLoading, buttonLabel } =
    useButtonState(
      quoteRequest,
      approvalAction,
      validation,
      quoteError,
      isQuoteLoading
    );

  const expectedInputAmount = useMemo(() => {
    return swapQuote?.inputAmount?.toString();
  }, [swapQuote]);
  const expectedOutputAmount = useMemo(() => {
    return swapQuote?.expectedOutputAmount?.toString();
  }, [swapQuote]);

  return (
    <LayoutV2 maxWidth={600}>
      <Wrapper>
        <InputForm
          originToken={quoteRequest.originToken}
          setOriginToken={(token: EnrichedToken | null) =>
            dispatchQuoteRequestAction({
              type: "SET_ORIGIN_TOKEN",
              payload: token,
            })
          }
          outputToken={quoteRequest.destinationToken}
          setDestinationToken={(token: EnrichedToken | null) => {
            dispatchQuoteRequestAction({
              type: "SET_DESTINATION_TOKEN",
              payload: token,
            });
          }}
          setOriginAmount={(amount: BigNumber | null) =>
            dispatchQuoteRequestAction({
              type: "SET_ORIGIN_AMOUNT",
              payload: amount,
            })
          }
          setDestinationAmount={(amount: BigNumber | null) =>
            dispatchQuoteRequestAction({
              type: "SET_DESTINATION_AMOUNT",
              payload: amount,
            })
          }
          isAmountOrigin={quoteRequest.tradeType === "exactInput"}
          isQuoteLoading={isQuoteLoading}
          expectedOutputAmount={expectedOutputAmount}
          expectedInputAmount={expectedInputAmount}
          validationError={validation.error}
          quoteRequest={quoteRequest}
          dispatchQuoteRequestAction={dispatchQuoteRequestAction}
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
