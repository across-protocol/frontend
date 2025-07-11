import React from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { COLORS, getConfig } from "utils";
import { Text } from "components/Text";
import { useOrderBook } from "../hooks/useOrderBook";
import { ChainId } from "utils/constants";

const availableChains = [
  ChainId.MAINNET,
  ChainId.POLYGON,
  ChainId.ARBITRUM,
  ChainId.BASE,
  ChainId.OPTIMISM,
];
const availableTokens = ["USDC", "USDC.e", "USDT", "DAI"];

const config = getConfig();

// Add the fade-in animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Create a styled component for the spread text with fade-in effect
const SpreadText = styled(Text)`
  animation: ${fadeIn} 0.5s ease-out;
`;

type Orderbook = {
  [relayerAddress: string]: {
    amount: number;
    spread: number;
  }[];
};

interface OrderBookProps {
  orderbook: Orderbook;
}

function OrderBook({ orderbook }: OrderBookProps) {
  function formatPrice(price: number) {
    return price.toFixed(2);
  }

  return (
    <OrderBookContainer>
      <OrderBookList>
        {Object.entries(orderbook).length > 0 ? (
          Object.entries(orderbook).map(([relayerAddress, orders], index) => (
            <OrderBookItem key={index} side="buy">
              <OrderRow>
                <Text size="sm" color="light-200" monospace>
                  {relayerAddress}
                </Text>
                <SpreadsContainer>
                  {orders.map((order) => (
                    <PriceAmount key={`${order.amount}-${order.spread}`}>
                      <Text size="sm" color="light-200" monospace>
                        {order.amount}
                      </Text>
                      <SpreadText size="sm" color="aqua" monospace>
                        @ {formatPrice(order.spread)} USD
                      </SpreadText>
                    </PriceAmount>
                  ))}
                </SpreadsContainer>
              </OrderRow>
            </OrderBookItem>
          ))
        ) : (
          <EmptyState>No orderbook</EmptyState>
        )}
      </OrderBookList>
    </OrderBookContainer>
  );
}

export function OrderBookWithSelectors() {
  const [originChainId, setOriginChainId] = React.useState<number>(1);
  const [destinationChainId, setDestinationChainId] =
    React.useState<number>(10);
  const [inputTokenSymbol, setInputTokenSymbol] =
    React.useState<string>("USDC");
  const [outputTokenSymbol, setOutputTokenSymbol] =
    React.useState<string>("USDC");

  const inputTokenAddress = config.getTokenInfoBySymbolSafe(
    originChainId,
    inputTokenSymbol
  )?.address;
  const outputTokenAddress = config.getTokenInfoBySymbolSafe(
    destinationChainId,
    outputTokenSymbol
  )?.address;

  const {
    data: orderBookData,
    isLoading,
    error,
  } = useOrderBook({
    originChainId,
    destinationChainId,
    inputToken: inputTokenAddress,
    outputToken: outputTokenAddress,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!orderBookData) {
    return <div>No orderbook data</div>;
  }

  return (
    <Wrapper>
      <SelectorsContainer>
        <SelectorsWrapper>
          <SelectorGroup>
            <SelectorLabel>
              <Text size="sm" color="grey-400">
                Origin Chain
              </Text>
            </SelectorLabel>
            <Selector
              value={originChainId}
              onChange={(e) => setOriginChainId(Number(e.target.value))}
            >
              {availableChains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))}
            </Selector>
          </SelectorGroup>

          <SelectorGroup>
            <SelectorLabel>
              <Text size="sm" color="grey-400">
                Destination Chain
              </Text>
            </SelectorLabel>
            <Selector
              value={destinationChainId}
              onChange={(e) => setDestinationChainId(Number(e.target.value))}
            >
              {availableChains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))}
            </Selector>
          </SelectorGroup>
        </SelectorsWrapper>

        <SelectorsWrapper>
          <SelectorGroup>
            <SelectorLabel>
              <Text size="sm" color="grey-400">
                Input Token
              </Text>
            </SelectorLabel>
            <Selector
              value={inputTokenSymbol}
              onChange={(e) => setInputTokenSymbol(e.target.value)}
            >
              {availableTokens.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </Selector>
          </SelectorGroup>

          <SelectorGroup>
            <SelectorLabel>
              <Text size="sm" color="grey-400">
                Output Token
              </Text>
            </SelectorLabel>
            <Selector
              value={outputTokenSymbol}
              onChange={(e) => setOutputTokenSymbol(e.target.value)}
            >
              {availableTokens.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </Selector>
          </SelectorGroup>
        </SelectorsWrapper>
      </SelectorsContainer>

      {orderBookData && <OrderBook orderbook={orderBookData} />}
    </Wrapper>
  );
}

const SelectorsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  width: 100%;
  gap: 24px;
`;

const SelectorsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const SelectorGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
`;

const SelectorLabel = styled.div`
  margin-bottom: 4px;
`;

const Selector = styled.select`
  padding: 8px 12px;
  background-color: ${COLORS["black-700"]};
  border: 1px solid ${COLORS["grey-600"]};
  border-radius: 4px;
  color: ${COLORS["light-200"]};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${COLORS["aqua"]};
  }

  option {
    background-color: ${COLORS["black-700"]};
    color: ${COLORS["light-200"]};
  }
`;

const SpreadsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OrderBookContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 600px;
  margin-bottom: 24px;
`;

const OrderBookList = styled.div`
  border: 1px solid ${COLORS["grey-600"]};
  border-radius: 0 0 4px 4px;
  background-color: ${COLORS["black-700"]};
  overflow-y: auto;
`;

const OrderBookItem = styled.div<{ side: "buy" | "sell" }>`
  padding: 8px 12px;
  border-bottom: 1px solid ${COLORS["grey-600"]};

  &:last-child {
    border-bottom: none;
  }
`;

const OrderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PriceAmount = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: ${COLORS["grey-400"]};
  font-size: 12px;
`;

export default OrderBookWithSelectors;
