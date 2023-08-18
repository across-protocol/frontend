import styled, { StyledComponent } from "@emotion/styled";
import { Theme } from "@emotion/react";
import { BigNumber } from "ethers";
import { useMemo } from "react";

import { Selector } from "components";
import { Text } from "components/Text";
import { SelectorPropType } from "components/Selector/Selector";

import { formatUnits, QUERIESV2, TokenInfo, getToken, Route } from "utils";
import { useBalancesBySymbols, useConnection } from "hooks";

import { RouteNotSupportedTooltipText } from "./RouteNotSupportedTooltipText";
import { getAvailableTokens, getAllTokens } from "../utils";

type Props = {
  selectedRoute: Route;
  onSelectToken: (token: string) => void;
};

const allTokens = getAllTokens();

export function TokenSelector({ selectedRoute, onSelectToken }: Props) {
  const { fromChain, toChain, fromTokenSymbol } = selectedRoute;
  const selectedToken = getToken(fromTokenSymbol);

  const { account } = useConnection();

  const orderedTokens: Array<
    TokenInfo & {
      disabled?: boolean;
    }
  > = useMemo(() => {
    const availableTokens = getAvailableTokens(fromChain, toChain);
    return [
      ...availableTokens,
      ...allTokens
        .filter(
          (t) =>
            !availableTokens.find(
              (availableToken) => availableToken.symbol === t.symbol
            )
        )
        .map((t) => ({ ...t, disabled: true })),
    ];
  }, [fromChain, toChain]);

  const { balances } = useBalancesBySymbols({
    tokenSymbols: orderedTokens.filter((t) => !t.disabled).map((t) => t.symbol),
    chainId: fromChain,
    account,
  });

  return (
    <TokenSelection
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
            <Text size="md" color="white-100">
              {t.displaySymbol || t.symbol.toUpperCase()}
            </Text>
          </CoinIconTextWrapper>
        ),
        suffix:
          balances && balances[i]?.gt(0) ? (
            <Text size="md" color="grey-400">
              {formatUnits(balances[i] ?? BigNumber.from(0), t.decimals)}
            </Text>
          ) : undefined,
      }))}
      displayElement={
        <CoinIconTextWrapper>
          <CoinIcon src={selectedToken.logoURI} />
          <Text size="md" color="white-100">
            {selectedToken.displaySymbol || selectedToken.symbol.toUpperCase()}
          </Text>
        </CoinIconTextWrapper>
      }
      selectedValue={selectedRoute.fromTokenSymbol}
      title="Coins"
      setSelectedValue={(v) => onSelectToken(v)}
      allowSelectDisabled
    />
  );
}

export default TokenSelector;

const TokenSelection = styled(Selector)`
  width: calc(30% - 6px);

  @media ${QUERIESV2.xs.andDown} {
    width: 100%;
  }
` as StyledComponent<
  SelectorPropType<string> & {
    theme?: Theme | undefined;
  },
  {},
  {}
>;

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
