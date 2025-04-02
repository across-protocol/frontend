import { useState, useEffect } from "react";
import { BigNumber, BigNumberish } from "ethers";

import { LayoutV2 } from "components";
import CardWrapper from "components/CardWrapper";
import { Tabs, Tab } from "components/Tabs";
import {
  formatNumberMaxFracDigits,
  formatUnitsWithMaxFractions,
  formatWeiPct,
  getConfig,
  max,
} from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import {
  useConnection,
  useIsWrongNetwork,
  useQueryParams,
  useStakingPool,
} from "hooks";

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

const tokenList = getConfig().getTokenPoolList();

export default function LiquidityPool() {
  const [action, setAction] = useState<PoolAction>("add");
  const [selectedToken, setSelectedToken] = useState(tokenList[0]);

  const { isConnected, connect } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandlerWithoutError } =
    useIsWrongNetwork();

  const userLiquidityPoolQuery = useUserLiquidityPool(selectedToken.symbol);
  const allLiquidityPoolQueries = useAllLiquidityPools();

  // Enable deep linking on the pool to access a specific pool symbol
  const { symbol: queryPoolSymbol } = useQueryParams();
  useEffect(() => {
    const resolvedToken = getConfig()
      .getTokenPoolList()
      .find(
        (token) =>
          queryPoolSymbol &&
          token.symbol.toLowerCase() === queryPoolSymbol.toLowerCase()
      );
    if (resolvedToken && selectedToken.symbol !== resolvedToken.symbol) {
      setSelectedToken(resolvedToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arePoolsLoading = allLiquidityPoolQueries.some(
    (query) => query.isLoading
  );
  const liquidityPools = allLiquidityPoolQueries.flatMap(
    (query) => query.data || []
  );

  const selectedLiquidityPool = liquidityPools.find(
    (pool) => pool.l1TokenSymbol === selectedToken.symbol
  );
  const formatTokenAmount = (amount?: BigNumberish) => {
    if (!selectedLiquidityPool || !amount) {
      return "-";
    }
    return `${formatUnitsWithMaxFractions(amount, selectedToken.decimals, {
      xl: 3,
    })} ${selectedToken.symbol}`;
  };

  const showValueOrDash = repeatableTernaryBuilder(!arePoolsLoading, "-");

  const stakingPoolQuery = useStakingPool(selectedToken.l1TokenAddress);

  const showStakingCTA = getConfig()
    .getStakingPoolTokenList()
    .map((v) => v.l1TokenAddress)
    .includes(selectedToken.l1TokenAddress);

  return (
    <>
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
              selectedTokenSymbol={selectedToken.symbol}
              onPoolSelected={(tokenSymbol) => {
                const token = tokenList.find(
                  (token) => token.symbol === tokenSymbol
                );
                setSelectedToken(token || tokenList[0]);
              }}
              pools={liquidityPools.map((pool) => ({
                tokenSymbol: pool.l1TokenSymbol,
                displaySymbol: pool.l1TokenDisplaySymbol,
                tokenLogoURI: pool.l1TokenLogoURI,
                poolSize: BigNumber.from(pool.totalPoolSize),
              }))}
            />
            <StatsRow data-cy="pool-info-box">
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
              tokenLogoURI={selectedToken.logoURI}
            />
            <UserStatRow
              label="Fees earned"
              value={showValueOrDash(
                formatTokenAmount(
                  stakingPoolQuery.data?.convertUnderlyingToLP &&
                    userLiquidityPoolQuery.data?.feesEarned
                    ? max(
                        stakingPoolQuery.data.convertUnderlyingToLP(
                          BigNumber.from(userLiquidityPoolQuery.data.feesEarned)
                        ),
                        0
                      )
                    : undefined
                )
              )}
              tokenLogoURI={selectedToken.logoURI}
            />
            {showStakingCTA && (
              <>
                <Divider />
                <EarnByStakingInfoBox
                  selectedToken={selectedToken}
                  selectedPoolAction={action}
                />
              </>
            )}
            <Divider />
            {!isConnected ? (
              <Button
                size="lg"
                data-cy="connect-wallet"
                onClick={() =>
                  connect({
                    trackSection:
                      action === "add"
                        ? "addLiquidityForm"
                        : "removeLiquidityForm",
                  })
                }
              >
                Connect Wallet
              </Button>
            ) : isWrongNetwork ? (
              <Button
                size="lg"
                onClick={() => isWrongNetworkHandlerWithoutError()}
              >
                Switch Network
              </Button>
            ) : (
              <ActionInputBlock action={action} selectedToken={selectedToken} />
            )}
          </CardWrapper>
        </Container>
      </LayoutV2>
    </>
  );
}
