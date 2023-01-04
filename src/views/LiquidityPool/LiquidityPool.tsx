import { useState } from "react";
import { BigNumber, BigNumberish } from "ethers";

import { LayoutV2 } from "components";
import CardWrapper from "components/CardWrapper";
import { Tabs, Tab } from "components/TabsV2";
import { formatNumberMaxFracDigits, formatUnits, formatWeiPct } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import { useConnection } from "hooks";

import Breadcrumb from "./components/Breadcrumb";
import PoolSelector from "./components/PoolSelector";
import StatBox from "./components/StatBox";
import UserStatRow from "./components/UserStatRow";
import EarnByStakingInfoBox from "./components/EarnByStakingInfoBox";
import { ActionInputBlock } from "./components/ActionInputBlock";

import { useAllLiquidityPools } from "./hooks/useLiquidityPool";
import { useUserLiquidityPool } from "./hooks/useUserLiquidityPool";

import { Container, StatsRow, Divider, Button } from "./LiquidityPool.styles";

type PoolAction = "add" | "remove";

export default function LiquidityPool() {
  const [action, setAction] = useState<PoolAction>("add");
  const [selectedPoolSymbol, setSelectedPoolSymbol] = useState("ETH");

  const { isConnected, connect } = useConnection();

  const allLiquidityPoolQueries = useAllLiquidityPools();
  const arePoolsLoading = allLiquidityPoolQueries.some(
    (query) => query.isLoading
  );
  const liquidityPools = allLiquidityPoolQueries.flatMap(
    (query) => query.data || []
  );

  const userLiquidityPoolQuery = useUserLiquidityPool(selectedPoolSymbol);

  const selectedLiquidityPool = liquidityPools.find(
    (pool) => pool.l1TokenSymbol === selectedPoolSymbol
  );
  const formatTokenAmount = (amount?: BigNumberish) => {
    if (!selectedLiquidityPool || !amount) {
      return "-";
    }
    return `${formatUnits(amount, selectedLiquidityPool.l1TokenDecimals, {
      xl: 3,
    })} ${selectedLiquidityPool.l1TokenSymbol}`;
  };

  const showValueOrDash = repeatableTernaryBuilder(!arePoolsLoading, "-");

  return (
    <LayoutV2 maxWidth={600}>
      <Container>
        <Breadcrumb />
        <CardWrapper>
          <Tabs>
            <Tab active={action === "add"} onClick={() => setAction("add")}>
              Add
            </Tab>
            <Tab
              active={action === "remove"}
              onClick={() => setAction("remove")}
            >
              Remove
            </Tab>
          </Tabs>
          <PoolSelector
            selectedL1TokenSymbol={selectedPoolSymbol}
            selectedL1TokenAddress={selectedLiquidityPool?.l1TokenAddress}
            onPoolSelected={setSelectedPoolSymbol}
            pools={liquidityPools.map((pool) => ({
              tokenSymbol: pool.l1TokenSymbol,
              tokenLogoURI: pool.l1TokenLogoURI,
              poolSize: BigNumber.from(pool.totalPoolSize),
            }))}
          />
          <StatsRow>
            <StatBox
              label="Pool size"
              value={showValueOrDash(
                formatTokenAmount(selectedLiquidityPool?.totalPoolSize)
              )}
            />
            <StatBox
              label="Pool utilization"
              value={showValueOrDash(
                `${formatWeiPct(
                  selectedLiquidityPool?.liquidityUtilizationCurrent
                )}%`
              )}
            />
            <StatBox
              label="Pool APY"
              value={showValueOrDash(
                `${formatNumberMaxFracDigits(
                  Number(selectedLiquidityPool?.estimatedApy) * 100
                )}%`
              )}
            />
          </StatsRow>
          <UserStatRow
            label="Position size"
            value={showValueOrDash(
              formatTokenAmount(userLiquidityPoolQuery.data?.positionValue)
            )}
            tokenLogoURI={selectedLiquidityPool?.l1TokenLogoURI}
          />
          <UserStatRow
            label="Fees earned"
            value={showValueOrDash(
              formatTokenAmount(userLiquidityPoolQuery.data?.feesEarned)
            )}
            tokenLogoURI={selectedLiquidityPool?.l1TokenLogoURI}
          />
          <Divider />
          <EarnByStakingInfoBox
            selectedTokenAddress={selectedLiquidityPool?.l1Token}
            selectedPoolAction={action}
          />
          <Divider />
          {!isConnected ? (
            <Button size="lg" onClick={() => connect()}>
              Connect Wallet
            </Button>
          ) : (
            <ActionInputBlock
              action={action}
              selectedL1TokenAddress={selectedLiquidityPool?.l1Token}
              selectedL1TokenDecimals={selectedLiquidityPool?.l1TokenDecimals}
              selectedL1TokenSymbol={selectedLiquidityPool?.l1TokenSymbol}
            />
          )}
        </CardWrapper>
      </Container>
    </LayoutV2>
  );
}
