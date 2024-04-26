import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { useMemo } from "react";

import { ReactComponent as LinkExternalIcon } from "assets/icons/link-external.svg";
import { Selector } from "components";
import { Text } from "components/Text";

import { formatUnitsWithMaxFractions, TokenInfo, getToken, Route } from "utils";
import { useBalancesBySymbols, useConnection } from "hooks";

import { RouteNotSupportedTooltipText } from "./RouteNotSupportedTooltipText";
import {
  getAvailableInputTokens,
  getAvailableOutputTokens,
  getAllTokens,
  getTokenExplorerLinkSafe,
} from "../utils";

type Props = {
  selectedRoute: Route;
  onSelectToken: (token: string) => void;
  inputOrOutputToken: "input" | "output";
  receiveTokenSymbol?: string;
};

const allTokens = getAllTokens();

export function TokenSelector({
  selectedRoute,
  onSelectToken,
  inputOrOutputToken,
  receiveTokenSymbol,
}: Props) {
  const isInputTokenSelector = inputOrOutputToken === "input";
  const { fromChain, toChain, fromTokenSymbol, toTokenSymbol } = selectedRoute;
  const selectedToken = getToken(
    isInputTokenSelector ? fromTokenSymbol : toTokenSymbol
  );
  const receiveToken = receiveTokenSymbol
    ? getToken(receiveTokenSymbol)
    : selectedToken;

  const { account } = useConnection();

  const orderedTokens: Array<
    TokenInfo & {
      disabled?: boolean;
    }
  > = useMemo(() => {
    const availableTokens = isInputTokenSelector
      ? getAvailableInputTokens(fromChain, toChain)
      : getAvailableOutputTokens(fromChain, toChain, fromTokenSymbol);
    return [
      ...availableTokens,
      ...(isInputTokenSelector
        ? allTokens
            .filter(
              (t) =>
                !availableTokens.find(
                  (availableToken) => availableToken.symbol === t.symbol
                )
            )
            .map((t) => ({ ...t, disabled: true }))
        : []),
    ];
  }, [fromChain, toChain, fromTokenSymbol, isInputTokenSelector]);

  const { balances } = useBalancesBySymbols({
    tokenSymbols: orderedTokens.filter((t) => !t.disabled).map((t) => t.symbol),
    chainId: isInputTokenSelector ? fromChain : toChain,
    account,
  });

  return (
    <Selector
      elements={orderedTokens.map((t, i) => ({
        value: t.symbol,
        disabled: t.disabled,
        disabledTooltip: {
          title: "Asset not supported on route.",
          description: (
            <RouteNotSupportedTooltipText
              symbol={t.symbol}
              fromChain={fromChain}
              toChain={toChain}
            />
          ),
        },
        element: (
          <CoinIconTextWrapper>
            <CoinIcon src={t.logoURI} />
            <ElementTextWrapper>
              <Text size="md" color="white-100">
                {t.name}
              </Text>
              {t.disabled ? (
                <Text size="xs" color="grey-400">
                  {t.displaySymbol || t.symbol.toUpperCase()}
                </Text>
              ) : (
                <TokenLink
                  href={getTokenExplorerLinkSafe(
                    isInputTokenSelector ? fromChain : toChain,
                    t.symbol
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Text size="xs" color="grey-400">
                    {t.displaySymbol || t.symbol.toUpperCase()}
                  </Text>
                  <LinkExternalIcon />
                </TokenLink>
              )}
            </ElementTextWrapper>
          </CoinIconTextWrapper>
        ),
        suffix:
          balances && balances[i]?.gt(0) ? (
            <Text size="lg" color="grey-400">
              {formatUnitsWithMaxFractions(
                balances[i] ?? BigNumber.from(0),
                t.decimals
              )}
            </Text>
          ) : undefined,
      }))}
      displayElement={
        <CoinIconTextWrapper>
          <CoinIcon src={receiveToken.logoURI} />
          <Text size="lg" color="white-100">
            {receiveToken.displaySymbol || receiveToken.symbol.toUpperCase()}
          </Text>
        </CoinIconTextWrapper>
      }
      selectedValue={receiveToken.symbol}
      title="Select a token"
      setSelectedValue={(v) => onSelectToken(v)}
      allowSelectDisabled
      disabled={orderedTokens.length === 1}
    />
  );
}

export default TokenSelector;

const CoinIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 12px;
`;

const CoinIcon = styled.img`
  width: 24px;
  height: 24px;
`;

const ElementTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const TokenLink = styled.a`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  text-decoration: none;

  &:hover {
    color: #9daab3;
    text-decoration: underline;
  }
`;
