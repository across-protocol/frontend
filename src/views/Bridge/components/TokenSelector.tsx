import styled from "@emotion/styled";
import { useMemo } from "react";

import { ReactComponent as LinkExternalIcon } from "assets/icons/arrow-up-right-boxed.svg";
import { Selector } from "components";
import { Text } from "components/Text";

import { TokenInfo, getTokenForChain, tokenList } from "utils";
import { useBalancesBySymbols } from "hooks/useBalance";

import { RouteNotSupportedTooltipText } from "./RouteNotSupportedTooltipText";
import {
  getAvailableInputTokens,
  getAvailableOutputTokens,
  getAllTokens,
  getTokenExplorerLinkSafe,
  SelectedRoute,
} from "../utils";

type Props = {
  selectedRoute: SelectedRoute;
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
  const {
    fromChain,
    toChain,
    fromTokenSymbol,
    toTokenSymbol,
    externalProjectId,
  } = selectedRoute;
  const relevantChainId = isInputTokenSelector ? fromChain : toChain;

  const selectedToken = getTokenForChain(
    isInputTokenSelector
      ? selectedRoute.type === "swap"
        ? selectedRoute.swapTokenSymbol
        : fromTokenSymbol
      : toTokenSymbol,
    relevantChainId
  );

  const tokenToDisplay = receiveTokenSymbol
    ? getTokenForChain(receiveTokenSymbol, relevantChainId)
    : selectedToken;

  const orderedTokens: Array<
    TokenInfo & {
      disabled?: boolean;
    }
  > = useMemo(() => {
    const availableTokens = isInputTokenSelector
      ? getAvailableInputTokens(fromChain, toChain, externalProjectId)
      : getAvailableOutputTokens(
          fromChain,
          toChain,
          fromTokenSymbol,
          externalProjectId
        );
    const orderedAvailableTokens = tokenList.filter((orderedToken) =>
      availableTokens.find(
        (availableToken) => availableToken.symbol === orderedToken.symbol
      )
    );
    return [
      ...orderedAvailableTokens,
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
    ].map((t) => getTokenForChain(t.symbol, relevantChainId));
  }, [
    fromChain,
    toChain,
    fromTokenSymbol,
    isInputTokenSelector,
    externalProjectId,
    relevantChainId,
  ]);

  const { balances } = useBalancesBySymbols({
    tokenSymbols: orderedTokens.filter((t) => !t.disabled).map((t) => t.symbol),
    chainId: isInputTokenSelector ? fromChain : toChain,
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
        suffix: balances[i]?.balance.gt(0) ? (
          <Text size="lg" color="grey-400">
            {balances[i]?.balanceFormatted}
          </Text>
        ) : undefined,
      }))}
      displayElement={
        <CoinIconTextWrapper>
          <CoinIcon src={tokenToDisplay.logoURI} />
          <Text size="lg" color="white-100">
            {tokenToDisplay.displaySymbol ||
              tokenToDisplay.symbol.toUpperCase()}
          </Text>
        </CoinIconTextWrapper>
      }
      modalProps={{
        height: 700,
        bottomYOffset: 16,
      }}
      selectedValue={tokenToDisplay.symbol}
      title="Select a token"
      setSelectedValue={(v) => onSelectToken(v)}
      allowSelectDisabled
      disabled={orderedTokens.length === 1}
      data-cy={`${inputOrOutputToken}-token-select`}
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
