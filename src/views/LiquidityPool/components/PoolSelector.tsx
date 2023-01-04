import { useEffect } from "react";
import styled, { StyledComponent } from "@emotion/styled";
import { BigNumber } from "ethers";
import { Theme } from "@emotion/react";

import { Selector, Text } from "components";
import { SelectorPropType } from "components/Selector/Selector";

import { useLiquidityPool } from "../hooks/useLiquidityPool";
import { useUserLiquidityPool } from "../hooks/useUserLiquidityPool";

type PoolInfo = {
  tokenSymbol: string;
  tokenLogoURI: string;
  poolSize: BigNumber;
};

type Props = {
  selectedL1TokenSymbol: string;
  selectedL1TokenAddress?: string;
  pools: PoolInfo[];
  onPoolSelected: (pool: string) => void;
};

export function PoolSelector({
  selectedL1TokenSymbol,
  selectedL1TokenAddress,
  pools,
  onPoolSelected,
}: Props) {
  const liquidityPoolQuery = useLiquidityPool(selectedL1TokenAddress);
  const userLiquidityPoolQuery = useUserLiquidityPool(selectedL1TokenSymbol);

  useEffect(() => {
    liquidityPoolQuery.refetch();
    userLiquidityPoolQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedL1TokenAddress]);

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
        selectedValue={selectedL1TokenSymbol}
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
