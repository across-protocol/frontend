import React, { useState } from "react";
import styled from "@emotion/styled";
import { COLORS, getConfig } from "utils";
import { Text } from "components/Text";
import { RelayerConfigsApiResponse } from "utils/serverless-api/prod/relayer-configs";
import { ReactComponent as ChevronRight } from "assets/icons/chevron-right.svg";
import Heartbeat from "./Heartbeat";
import { DateTime } from "luxon";

type ConfigsTableProps = {
  data: RelayerConfigsApiResponse;
};

function ConfigsTable({ data }: ConfigsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const getSortedAmounts = (
    amounts: Record<string, number>,
    ascOrDesc: "asc" | "desc"
  ) => {
    return Object.entries(amounts).sort((a, b) => {
      return ascOrDesc === "asc" ? a[1] - b[1] : b[1] - a[1];
    });
  };

  const renderPriceConfig = (prices: any) => {
    return Object.entries(prices).map(([chainId, chainData]: [string, any]) => (
      <ConfigSection key={chainId}>
        <Text size="sm" color="grey-400">
          Chain ID:{" "}
          <Text size="sm" as="span" monospace>
            {chainId}
          </Text>
        </Text>

        <OrderbookContainer>
          <OrderbookColumn>
            <OrderbookHeader>
              <Text color="aqua" size="sm" weight={500} monospace>
                BUY
              </Text>
            </OrderbookHeader>
            <OrderbookList>
              {chainData.origin && Object.keys(chainData.origin).length > 0 ? (
                Object.entries(chainData.origin).map(
                  ([baseCurrency, tokens]: [string, any]) =>
                    Object.entries(tokens).map(
                      ([token, amounts]: [string, any]) =>
                        getSortedAmounts(amounts, "desc").map(
                          ([amount, price]: [string, any]) => (
                            <OrderbookItem
                              key={`${baseCurrency}-${token}-${amount}`}
                              side="buy"
                            >
                              <Token token={token} chainId={chainId} />
                              <Text size="sm" color="light-100" monospace>
                                {amount}
                              </Text>
                              <Text size="sm" color="light-100" monospace>
                                {" "}
                                @ {price} {baseCurrency.toUpperCase()}
                              </Text>
                            </OrderbookItem>
                          )
                        )
                    )
                )
              ) : (
                <EmptyState>No buy configs</EmptyState>
              )}
            </OrderbookList>
          </OrderbookColumn>

          <OrderbookColumn>
            <OrderbookHeader>
              <Text color="red" size="sm" weight={500} monospace>
                SELL
              </Text>
            </OrderbookHeader>
            <OrderbookList>
              {chainData.destination &&
              Object.keys(chainData.destination).length > 0 ? (
                Object.entries(chainData.destination).map(
                  ([baseCurrency, tokens]: [string, any]) =>
                    Object.entries(tokens).map(
                      ([token, amounts]: [string, any]) =>
                        getSortedAmounts(amounts, "asc").map(
                          ([amount, price]: [string, any]) => (
                            <OrderbookItem
                              key={`${baseCurrency}-${token}-${amount}`}
                              side="sell"
                            >
                              <Token token={token} chainId={chainId} />
                              <Text size="sm" color="light-100" monospace>
                                {amount}
                              </Text>
                              <Text size="sm" color="light-100" monospace>
                                {" "}
                                @ {price} {baseCurrency.toUpperCase()}
                              </Text>
                            </OrderbookItem>
                          )
                        )
                    )
                )
              ) : (
                <EmptyState>No sell configs</EmptyState>
              )}
            </OrderbookList>
          </OrderbookColumn>
        </OrderbookContainer>
      </ConfigSection>
    ));
  };

  return (
    <Wrapper>
      <StyledTable>
        <StyledHead>
          <StyledHeadRow>
            <StyledHeadCell width={500}>
              <Text color="grey-400">Relayer</Text>
            </StyledHeadCell>
            <StyledHeadCell width={200}>
              <Text color="grey-400">Config Summary</Text>
            </StyledHeadCell>
            <StyledHeadCell width={200}>
              <Text color="grey-400">Heartbeat</Text>
            </StyledHeadCell>
          </StyledHeadRow>
        </StyledHead>
        <tbody>
          {data.map((item, index) => {
            const isExpanded = expandedRows.has(index);
            const priceChains = Object.keys(item.prices || {});

            return (
              <React.Fragment key={index}>
                <StyledRow clickable onClick={() => toggleRow(index)}>
                  <StyledCell width={500}>
                    <ChevronIcon expanded={isExpanded}>
                      <ChevronRight />
                    </ChevronIcon>
                    <Text monospace>{item.authentication.address}</Text>
                  </StyledCell>
                  <StyledCell width={200}>
                    <Text>
                      {priceChains.length > 0
                        ? `${priceChains.length} chain(s) configured`
                        : "No price config"}
                    </Text>
                  </StyledCell>
                  <StyledCell width={200}>
                    <Heartbeat />
                    <Text>
                      {DateTime.fromMillis(item.updatedAt).toRelative()}
                    </Text>
                  </StyledCell>
                </StyledRow>
                {isExpanded && (
                  <StyledRow>
                    <StyledCell>
                      <ExpandableContent>
                        <ConfigDetails>
                          <div>
                            <Text>Prices</Text>
                            {item.prices &&
                            Object.keys(item.prices).length > 0 ? (
                              renderPriceConfig(item.prices)
                            ) : (
                              <p>No price configuration available</p>
                            )}
                          </div>

                          <div>
                            <Text>Min Exclusivity Periods</Text>
                            {Object.keys(item.minExclusivityPeriods || {})
                              .length > 0 ? (
                              <pre>
                                {JSON.stringify(
                                  item.minExclusivityPeriods,
                                  null,
                                  2
                                )}
                              </pre>
                            ) : (
                              <p>No exclusivity periods configured</p>
                            )}
                          </div>
                        </ConfigDetails>
                      </ExpandableContent>
                    </StyledCell>
                  </StyledRow>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </StyledTable>
    </Wrapper>
  );
}

function Token({ token, chainId }: { token: string; chainId: string }) {
  const tokenInfo = getConfig().getTokenInfoByAddressSafe(
    Number(chainId),
    token
  );
  if (!tokenInfo) {
    return null;
  }
  return (
    <TokenWrapper>
      <img
        src={tokenInfo.logoURI}
        alt={tokenInfo.name}
        width={16}
        height={16}
      />
      <Text size="xs" color="grey-400">
        {tokenInfo.symbol}
      </Text>
    </TokenWrapper>
  );
}

const TokenWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  width: 64px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  white-space: nowrap;
  table-layout: fixed;
`;

const StyledHead = styled.thead``;

const StyledHeadRow = styled.tr`
  display: flex;
  height: 40px;
  align-items: center;
  padding: 0px 24px;
  gap: 16px;
  background-color: ${COLORS["black-700"]};
  border-radius: 12px 12px 0px 0px;
  border: ${COLORS["grey-600"]} 1px solid;
`;

const StyledHeadCell = styled.th<{ width: number }>`
  display: flex;
  width: ${({ width }) => width}px;
  gap: 4px;
  flex-direction: row;
  align-items: center;
  padding-right: 4px;
`;

const StyledRow = styled.tr<{ clickable?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 0px 24px;
  border-width: 0px 1px 1px 1px;
  border-style: solid;
  border-color: ${COLORS["grey-600"]};
  cursor: ${({ clickable }) => (clickable ? "pointer" : "default")};

  &:hover {
    background-color: ${({ clickable }) =>
      clickable ? COLORS["grey-500"] : "transparent"};
  }
`;

const StyledCell = styled.td<{ width?: number }>`
  display: flex;
  width: ${({ width }) => (width ? `${width}px` : "100%")};
  align-items: center;
  gap: 8px;
  padding: 16px 0;
`;

const ChevronIcon = styled.span<{ expanded: boolean }>`
  transition: transform 0.2s ease;
  transform: ${({ expanded }) => (expanded ? "rotate(90deg)" : "rotate(0deg)")};
  display: inline-block;
  margin-right: 8px;
`;

const ExpandableContent = styled.div`
  padding: 16px 24px;
  /* background-color: ${COLORS["grey-500"]}; */
  /* border-top: 1px solid ${COLORS["grey-600"]}; */
  width: 100%;
`;

const ConfigDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ConfigSection = styled.div`
  padding-top: 12px;
  border-radius: 6px;
  margin-bottom: 24px;
`;

const OrderbookContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 12px;
`;

const OrderbookColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

const OrderbookHeader = styled.div`
  padding: 8px 12px;
  background-color: ${COLORS["black-800"]};
  border-radius: 4px 4px 0 0;
  text-align: center;
  border: 1px solid ${COLORS["grey-600"]};
  border-bottom: none;
`;

const OrderbookList = styled.div`
  border: 1px solid ${COLORS["grey-600"]};
  border-radius: 0 0 4px 4px;
  background-color: ${COLORS["black-700"]};
  max-height: 200px;
  overflow-y: auto;
`;

const OrderbookItem = styled.div<{ side: "buy" | "sell" }>`
  padding: 6px 12px;
  border-bottom: 1px solid ${COLORS["grey-600"]};
  display: flex;
  flex-direction: row;
  gap: 2px;
  align-items: center;
  justify-content: space-between;

  &:last-child {
    border-bottom: none;
  }
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: ${COLORS["grey-400"]};
  font-size: 12px;
`;

const OrderBookHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export default ConfigsTable;
