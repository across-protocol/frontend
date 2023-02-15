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
  selectedTokenSymbol: string;
  pools: PoolInfo[];
  onPoolSelected: (tokenSymbol: string) => void;
};

export function PoolSelector({
  selectedTokenSymbol,
  pools,
  onPoolSelected,
}: Props) {
  const liquidityPoolQuery = useLiquidityPool(selectedTokenSymbol);
  const userLiquidityPoolQuery = useUserLiquidityPool(selectedTokenSymbol);

  useEffect(() => {
    liquidityPoolQuery.refetch();
    userLiquidityPoolQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTokenSymbol]);

  return (
    <Wrapper>
      <TokenSelection
        data-cy="select-pool"
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
        selectedValue={selectedTokenSymbol}
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
