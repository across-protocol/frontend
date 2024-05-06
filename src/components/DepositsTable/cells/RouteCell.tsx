import styled from "@emotion/styled";

import { Text } from "components/Text";
import { IconPair } from "components/IconPair";
import { Deposit } from "hooks/useDeposits";
import { getChainInfo } from "utils";

import { BaseCell } from "./BaseCell";

type Props = {
  deposit: Deposit;
  width: number;
};

export function RouteCell({ deposit, width }: Props) {
  const sourceChain = getChainInfo(deposit.sourceChainId);
  const destinationChain = getChainInfo(deposit.destinationChainId);

  return (
    <StyledRouteCell width={width}>
      <IconPairContainer>
        <IconPair
          LeftIcon={
            <img src={sourceChain.logoURI} alt={`${sourceChain.name} logo`} />
          }
          RightIcon={
            <img
              src={destinationChain.logoURI}
              alt={`${destinationChain.name} logo`}
            />
          }
          iconSize={24}
        />
      </IconPairContainer>
      <ChainNamesContainer>
        <Text color="light-200">→ {destinationChain.name}</Text>
        <Text size="sm" color="grey-400">
          {sourceChain.name}
        </Text>
      </ChainNamesContainer>
    </StyledRouteCell>
  );
}

const StyledRouteCell = styled(BaseCell)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
`;

const IconPairContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ChainNamesContainer = styled.div``;
