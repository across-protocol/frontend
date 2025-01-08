import styled from "@emotion/styled";

import { Selector } from "components";
import { Text } from "components/Text";

import {
  ChainInfo,
  Route,
  capitalizeFirstLetter,
  formatUnitsWithMaxFractions,
  getChainInfo,
  getToken,
  shortenAddress,
} from "utils";

import { getAllChains } from "../utils";
import { useBalanceBySymbolPerChain, useConnection } from "hooks";
import { useMemo } from "react";
import { BigNumber } from "ethers";
import { externConfigs } from "constants/chains/configs";

type Props = {
  selectedRoute: Route;
  fromOrTo: "from" | "to";
  toAddress?: string;
  onSelectChain: (chainId: number) => void;
};

const allChains = getAllChains();

export function ChainSelector({
  selectedRoute,
  fromOrTo,
  toAddress,
  onSelectChain,
}: Props) {
  const isFrom = fromOrTo === "from";
  const {
    fromChain,
    toChain,
    fromTokenSymbol,
    toTokenSymbol,
    externalProjectId,
  } = selectedRoute;
  const selectedChain = getChainInfo(isFrom ? fromChain : toChain);

  const tokenInfo = getToken(isFrom ? fromTokenSymbol : toTokenSymbol);

  const { account, isConnected } = useConnection();
  const { balances } = useBalanceBySymbolPerChain({
    tokenSymbol: tokenInfo.symbol,
    chainIds: allChains.map((c) => c.chainId),
    account,
  });

  const sortOrder = useMemo(() => {
    const chains = allChains.map((c) => ({
      ...c,
      balance: balances?.[c.chainId] ?? BigNumber.from(0),
      disabled: false,
    }));
    if (!balances || !isConnected || !isFrom) {
      return chains;
    } else {
      return chains
        .map((c) => ({
          ...c,
          disabled: c.balance.eq(0),
        }))
        .sort((a, b) => {
          const aBalance = a.balance;
          const bBalance = b.balance;
          if (aBalance === undefined && bBalance === undefined) {
            return 0;
          } else if (aBalance === undefined) {
            return 1;
          } else if (bBalance === undefined) {
            return -1;
          } else {
            return aBalance.lt(bBalance) ? 1 : -1;
          }
        });
    }
  }, [balances, isConnected, isFrom]);

  return (
    <Selector<number>
      elements={sortOrder.map((chain) => ({
        value: chain.chainId,
        element: (
          <ChainInfoElement
            chain={chain}
            externalProjectId={
              fromOrTo === "to" ? externalProjectId : undefined
            }
          />
        ),
        suffix:
          isConnected && isFrom ? (
            <Text size="lg" color="grey-400">
              {formatUnitsWithMaxFractions(chain.balance, tokenInfo.decimals)}
            </Text>
          ) : undefined,
      }))}
      displayElement={
        isFrom ? (
          <ChainInfoElement
            chain={selectedChain}
            superText={
              toAddress
                ? `Address: ${shortenAddress(toAddress, "...", 4)}`
                : undefined
            }
          />
        ) : undefined
      }
      selectedValue={isFrom ? fromChain : toChain}
      setSelectedValue={onSelectChain}
      title={
        <TitleWrapper>
          <Text size="md" color="grey-400">
            Select chain to send
          </Text>
          <TitleTokenImg src={tokenInfo.logoURI} />
          <Text size="md" color="grey-400">
            {isFrom ? "from" : "to"}
          </Text>
        </TitleWrapper>
      }
      allowSelectDisabled={!isFrom}
      data-cy={`${fromOrTo}-chain-select`}
    />
  );
}

function ChainInfoElement({
  chain,
  externalProjectId,
  superText,
}: {
  chain: ChainInfo;
  externalProjectId?: string;
  superText?: string;
}) {
  const externalProject = externalProjectId
    ? externConfigs[externalProjectId]
    : null;
  return (
    <ChainIconTextWrapper>
      <ChainIcon src={externalProject?.logoURI ?? chain.logoURI} />
      <ChainIconSuperTextWrapper>
        {superText && (
          <Text size="sm" color="grey-400">
            {superText}
          </Text>
        )}
        <Text size="lg" color="white-100">
          {capitalizeFirstLetter(
            externalProject?.name ?? chain.fullName ?? chain.name
          )}
        </Text>
      </ChainIconSuperTextWrapper>
    </ChainIconTextWrapper>
  );
}

export default ChainSelector;

const ChainIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 12px;
`;

const ChainIcon = styled.img`
  width: 24px;
  height: 24px;
`;

const ChainIconSuperTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0px;
`;

const TitleWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

const TitleTokenImg = styled.img`
  width: 16px;
  height: 16px;
  margin-top: 2px;
`;
