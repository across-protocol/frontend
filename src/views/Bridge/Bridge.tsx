import { LayoutV2 } from "components";
import Selector from "components/Selector/Selector";
import { Text } from "components/Text";
import { capitalizeFirstLetter } from "utils";
import {
  CardWrapper,
  ChainIcon,
  ChainIconTextWrapper,
  RowWrapper,
  Wrapper,
} from "./Bridge.styles";
import Breadcrumb from "./components/Breadcrumb";
import CoinSelector from "./components/CoinSelector";
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
  } = useBridge();
  return (
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
        </CardWrapper>
      </Wrapper>
    </LayoutV2>
  );
};

export default Bridge;
