import { LayoutV2 } from "components";
import styled from "@emotion/styled";
import { InputForm } from "./components/InputForm";
import { useSwapAndBridge } from "./hooks/useSwapAndBridge";
import { useQuoteRequest } from "./hooks/useQuoteRequest/useQuoteRequest";
import { EnrichedToken } from "./components/ChainTokenSelector/ChainTokenSelectorModal";
import { BigNumber } from "ethers";
import { useDefaultRouteInQuote } from "./hooks/useQuoteRequest/useDefaultRouteInQuote";
import { useAccountInQuote } from "./hooks/useQuoteRequest/useAccountInQuote";
import { ConfirmationButton } from "./components/Confirmation/ConfirmationButton";

export default function SwapAndBridge() {
  const { quoteRequest, dispatchQuoteRequestAction } = useQuoteRequest();
  useDefaultRouteInQuote(dispatchQuoteRequestAction);
  useAccountInQuote(quoteRequest, dispatchQuoteRequestAction);

  const isAmountOrigin = quoteRequest.tradeType === "exactInput";

  const {
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
    priceImpact,
  } = useSwapAndBridge(quoteRequest);

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
          isAmountOrigin={isAmountOrigin}
          isQuoteLoading={isQuoteLoading}
          expectedOutputAmount={expectedOutputAmount}
          expectedInputAmount={expectedInputAmount}
          validationError={validationError}
          destinationChainEcosystem={destinationChainEcosystem}
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
          priceImpact={priceImpact}
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
