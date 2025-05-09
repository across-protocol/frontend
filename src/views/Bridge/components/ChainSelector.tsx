import styled from "@emotion/styled";

import { Selector } from "components";
import { Text } from "components/Text";

import {
  ChainInfo,
  Route,
  capitalizeFirstLetter,
  getChainInfo,
  getToken,
  shortenAddress,
} from "utils";

import { useBalanceBySymbolPerChain, useConnection } from "hooks";
import { useMemo } from "react";
import { BigNumber } from "ethers";
import { getSupportedChains } from "../utils";
import { externConfigs } from "constants/chains/configs";

type Props = {
  selectedRoute: Route;
  fromOrTo: "from" | "to";
  toAddress?: string;
  onSelectChain: (chainId: number, externalProjectId?: string) => void;
};

export function ChainSelector({
  selectedRoute,
  fromOrTo,
  toAddress,
  onSelectChain,
}: Props) {
  const isFrom = fromOrTo === "from";
  const { fromChain, toChain, fromTokenSymbol, toTokenSymbol } = selectedRoute;

  const selectedChain = getChainInfo(isFrom ? fromChain : toChain);
  const tokenInfo = getToken(isFrom ? fromTokenSymbol : toTokenSymbol);

  // Get supported chains and filter based on external projects
  const availableChains = filterAvailableChains(fromOrTo, selectedRoute);

  const { account, isConnected } = useConnection();
  const { balancesPerChain } = useBalanceBySymbolPerChain({
    tokenSymbol: tokenInfo.symbol,
    chainIds: availableChains.map((c) => c.chainId),
    account,
  });

  const sortedChains = useMemo(
    () => sortChains(availableChains, balancesPerChain, isConnected, isFrom),
    [availableChains, balancesPerChain, isConnected, isFrom]
  );

  return (
    <Selector<{ chainId: number; externalProjectId?: string }>
      elements={sortedChains.map((chain) => ({
        value: { chainId: chain.chainId, externalProjectId: chain.projectId },
        element: <ChainInfoElement chain={chain} />,
        suffix:
          isConnected && isFrom ? (
            <Text size="lg" color="grey-400">
              {chain.balanceFormatted}
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
      selectedValue={{
        chainId: isFrom ? fromChain : toChain,
        externalProjectId: isFrom ? undefined : selectedRoute.externalProjectId,
      }}
      setSelectedValue={(val) =>
        onSelectChain(val.chainId, val.externalProjectId)
      }
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
      modalProps={{
        height: 700,
        bottomYOffset: 16,
      }}
    />
  );
}

function ChainInfoElement({
  chain,
  superText,
}: {
  chain: Pick<ChainInfo, "chainId" | "name" | "fullName" | "logoURI">;
  superText?: string;
}) {
  return (
    <ChainIconTextWrapper>
      <ChainIcon src={chain.logoURI} />
      <ChainIconSuperTextWrapper>
        {superText && (
          <Text size="sm" color="grey-400">
            {superText}
          </Text>
        )}
        <Text size="lg" color="white-100">
          {capitalizeFirstLetter(chain.fullName ?? chain.name)}
        </Text>
      </ChainIconSuperTextWrapper>
    </ChainIconTextWrapper>
  );
}

/**
 * Filters supported chains based on external project constraints
 */
function filterAvailableChains(fromOrTo: "from" | "to", selectedRoute: Route) {
  const isFrom = fromOrTo === "from";
  let chains = getSupportedChains(fromOrTo);
  const { externalProjectId, fromChain } = selectedRoute;

  if (externalProjectId && isFrom) {
    const { intermediaryChain } = externConfigs[externalProjectId];
    chains = chains.filter((r) => r.chainId !== intermediaryChain);
  }

  if (!isFrom) {
    chains = chains.filter(({ projectId }) => {
      if (!projectId) return true;
      const { intermediaryChain } = externConfigs[projectId];
      return fromChain !== intermediaryChain;
    });
  }

  return chains;
}

/**
 * Sorts chains based on balance and availability
 */
function sortChains(
  chains: ReturnType<typeof getSupportedChains>,
  balances: Record<
    number,
    {
      balance: BigNumber;
      balanceFormatted: string;
      balanceComparable: BigNumber;
    }
  >,
  isConnected: boolean,
  isFrom: boolean
) {
  return chains
    .map((c) => ({
      ...c,
      balance: balances?.[c.chainId].balance ?? BigNumber.from(0),
      balanceFormatted: balances?.[c.chainId].balanceFormatted ?? "0",
      balanceComparable:
        balances?.[c.chainId].balanceComparable ?? BigNumber.from(0),
      disabled:
        !isConnected || !isFrom ? false : balances?.[c.chainId]?.balance?.eq(0),
    }))
    .sort((a, b) => {
      if (!isConnected || !isFrom) return 0;
      if (a.balance === undefined) return 1;
      if (b.balance === undefined) return -1;
      return a.balanceComparable.lt(b.balanceComparable) ? 1 : -1;
    });
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
