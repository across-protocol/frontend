import styled from "@emotion/styled";

import { Text } from "components/Text";
import { IconPair } from "components/IconPair";
import { Deposit } from "hooks/useDeposits";
import { ChainInfo, getChainInfo, isHyperLiquidBoundDeposit } from "utils";

import { BaseCell } from "./BaseCell";
import { externConfigs } from "constants/chains/configs";

type Props = {
  deposit: Deposit;
  width: number;
};

export function RouteCell({ deposit, width }: Props) {
  const isHyperLiquidDeposit = isHyperLiquidBoundDeposit(deposit);

  const sourceChain = getChainInfo(deposit.sourceChainId);
  const destinationChain: Pick<ChainInfo, "name" | "logoURI"> =
    isHyperLiquidDeposit
      ? externConfigs["hyper-liquid"]
      : getChainInfo(deposit.destinationChainId);

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
      <div>
        <ChainNameText color="light-200">
          → {destinationChain.name}
        </ChainNameText>
        <ChainNameText size="sm" color="grey-400">
          {sourceChain.name}
        </ChainNameText>
      </div>
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

const ChainNameText = styled(Text)`
  text-overflow: ellipsis;
`;
