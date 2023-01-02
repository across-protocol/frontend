import styled, { StyledComponent } from "@emotion/styled";
import { Selector } from "components";
import { Text } from "components/Text";
import { BigNumber } from "ethers";
import { Theme } from "@emotion/react";
import { SelectorPropType } from "components/Selector/Selector";

type PoolInfo = {
  tokenSymbol: string;
  tokenLogoURI: string;
  poolSize: BigNumber;
};

type Props = {
  selectedPoolSymbol: string;
  pools: PoolInfo[];
  onPoolSelected: (pool: string) => void;
};

export function PoolSelector({
  selectedPoolSymbol,
  pools,
  onPoolSelected,
}: Props) {
  return (
    <Wrapper>
      <TokenSelection
        elements={pools.map((p) => ({
          value: p.tokenSymbol,
          element: (
            <PoolIconTextWrapper>
              <PoolIcon src={p.tokenLogoURI} />
              <Text size="md" color="white-100">
                {p.tokenSymbol.toUpperCase()} Pool
              </Text>
            </PoolIconTextWrapper>
          ),
        }))}
        selectedValue={selectedPoolSymbol}
        title="Pools"
        setSelectedValue={(v) => onPoolSelected(v)}
      />
    </Wrapper>
  );
}

export default PoolSelector;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
  width: 100%;
`;

const TokenSelection = styled(Selector)`` as StyledComponent<
  SelectorPropType<string> & {
    theme?: Theme | undefined;
  },
  {},
  {}
>;

const PoolIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 12px;
`;

const PoolIcon = styled.img`
  width: 24px;
  height: 24px;
`;
