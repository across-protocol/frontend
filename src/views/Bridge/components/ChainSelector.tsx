import styled from "@emotion/styled";

import { Selector } from "components";
import { Text } from "components/Text";

import {
  ChainInfo,
  Route,
  capitalizeFirstLetter,
  getChainInfo,
  shortenAddress,
} from "utils";

import { getAllChains } from "../utils";

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
  const { fromChain, toChain } = selectedRoute;
  const selectedChain = getChainInfo(fromOrTo === "from" ? fromChain : toChain);

  return (
    <Selector<number>
      elements={allChains.map((chain) => ({
        value: chain.chainId,
        element: <ChainInfoElement chain={chain} />,
      }))}
      displayElement={
        fromOrTo === "to" ? (
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
      selectedValue={fromOrTo === "from" ? fromChain : toChain}
      setSelectedValue={onSelectChain}
      title="Chain"
      allowSelectDisabled
    />
  );
}

function ChainInfoElement({
  chain,
  superText,
}: {
  chain: ChainInfo;
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
