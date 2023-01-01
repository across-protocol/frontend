import { LayoutV2, SuperHeader } from "components";
import Selector from "components/Selector/Selector";
import { Text } from "components/Text";
import {
  capitalizeFirstLetter,
  getChainInfo,
  getToken,
  receiveAmount,
} from "utils";
import {
  Button,
  CardWrapper,
  ChainIcon,
  ChainIconTextWrapper,
  Divider,
  QuickSwapWrapper,
  RowWrapper,
  Wrapper,
} from "./Bridge.styles";
import Breadcrumb from "./components/Breadcrumb";
import CoinSelector from "./components/CoinSelector";
import EstimatedTable from "./components/EstimatedTable";
import QuickSwap from "./components/QuickSwap";
import SlippageAlert from "./components/SlippageAlert";
import { useBridge } from "./hooks/useBridge";

const Bridge = () => {
  const {
    availableTokens,
    currentToken,
    setCurrentToken,
    setAmountToBridge,
    currentBalance,
    currentFromRoute,
    setCurrentFromRoute,
    availableFromRoutes,
    availableToRoutes,
    currentToRoute,
    setCurrentToRoute,
    isWrongChain,
    handleChainSwitch,
    handleQuickSwap,
    isConnected,
    buttonActionHandler,
    buttonLabel,
    isBridgeDisabled,
    fees,
    amountToBridge,
    estimatedTime,
  } = useBridge();
  return (
    <>
      {isWrongChain && currentFromRoute && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={handleChainSwitch}>
              switch to {getChainInfo(currentFromRoute).name}
            </button>
            .
          </div>
        </SuperHeader>
      )}
      <LayoutV2 maxWidth={600}>
        <Wrapper>
          <Breadcrumb />
          <CardWrapper>
            <RowWrapper>
              <Text size="md" color="grey-400">
                Send
              </Text>
              <CoinSelector
                fromChain={currentFromRoute ?? 1}
                toChain={currentToRoute ?? 1}
                tokenChoices={availableTokens}
                tokenSelected={currentToken}
                onTokenSelected={setCurrentToken}
                onAmountToBridgeChanged={setAmountToBridge}
                currentSelectedBalance={currentBalance}
              />
            </RowWrapper>
            <RowWrapper>
              <Text size="md" color="grey-400">
                From
              </Text>
              <Selector<number>
                elements={availableFromRoutes.map((r) => ({
                  value: r.chainId,
                  element: (
                    <ChainIconTextWrapper>
                      <ChainIcon src={r.logoURI} />
                      <Text size="md" color="white-100">
                        {capitalizeFirstLetter(r.fullName ?? r.name)}
                      </Text>
                    </ChainIconTextWrapper>
                  ),
                }))}
                selectedValue={currentFromRoute ?? 1}
                setSelectedValue={(v) => setCurrentFromRoute(v)}
                title="Chain"
              />
            </RowWrapper>
            <RowWrapper>
              <Text size="md" color="grey-400">
                To
              </Text>
              <QuickSwapWrapper>
                <QuickSwap onQuickSwap={handleQuickSwap} />
              </QuickSwapWrapper>
              <Selector<number>
                elements={availableToRoutes.map((r) => ({
                  value: r.chainId,
                  element: (
                    <ChainIconTextWrapper>
                      <ChainIcon src={r.logoURI} />
                      <Text size="md" color="white-100">
                        {capitalizeFirstLetter(r.fullName ?? r.name)}
                      </Text>
                    </ChainIconTextWrapper>
                  ),
                }))}
                selectedValue={currentToRoute ?? 1}
                setSelectedValue={(v) => setCurrentToRoute(v)}
                title="Chain"
              />
            </RowWrapper>
          </CardWrapper>
          <CardWrapper>
            <SlippageAlert />
            {currentToRoute && (
              <EstimatedTable
                chainId={currentToRoute}
                estimatedTime={estimatedTime}
                gasFee={fees?.relayerGasFee.total}
                bridgeFee={fees?.relayerCapitalFee.total}
                totalReceived={
                  fees && amountToBridge && amountToBridge.gt(0)
                    ? receiveAmount(amountToBridge, fees)
                    : undefined
                }
                token={getToken(currentToken)}
                dataLoaded={isConnected}
              />
            )}
            <Divider />
            <Button disabled={isBridgeDisabled} onClick={buttonActionHandler}>
              <Text color="dark-grey" weight={500}>
                {buttonLabel}
              </Text>
            </Button>
          </CardWrapper>
        </Wrapper>
      </LayoutV2>
    </>
  );
};

export default Bridge;
