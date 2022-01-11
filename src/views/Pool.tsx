import { FC, useState, useEffect } from "react";
import { ethers } from "ethers";
import Layout from "components/Layout";
import PoolSelection from "components/PoolSelection";
import PoolForm from "components/PoolForm";
import DepositSuccess from "components/PoolForm/DepositSuccess";
import {
  DEFAULT_TO_CHAIN_ID,
  TOKENS_LIST,
  ChainId,
  Token,
  UnsupportedChainIdError,
  COLORS,
  QUERIES,
  max,
} from "utils";
import { useAppSelector, useConnection, useBalance } from "state/hooks";
import get from "lodash/get";
import { poolClient } from "state/poolsApi";
import styled from "@emotion/styled";
import BouncingDotsLoader from "components/BouncingDotsLoader";

import { BounceType } from "components/BouncingDotsLoader/BouncingDotsLoader";

export type ShowSuccess = "deposit" | "withdraw";

const Pool: FC = () => {
  const [token, setToken] = useState<Token>(TOKENS_LIST[ChainId.MAINNET][2]);
  const [showSuccess, setShowSuccess] = useState<ShowSuccess | undefined>();
  const [depositUrl, setDepositUrl] = useState("");
  const [loadingPoolState, setLoadingPoolState] = useState(false);
  const [defaultTab, setDefaultTab] = useState("Add");
  const pool = useAppSelector((state) => state.pools.pools[token.bridgePool]);
  const connection = useAppSelector((state) => state.connection);
  const userPosition = useAppSelector((state) =>
    get(state, [
      "pools",
      "users",
      state?.connection?.account || "",
      token.bridgePool,
    ])
  );

  const { isConnected, account, provider, error, chainId } = useConnection();

  const queries = useAppSelector((state) => state.api.queries);

  const { balance, refetch: refetchBalance } = useBalance({
    chainId: ChainId.MAINNET,
    account,
    tokenAddress: token.address,
  });

  const wrongNetwork =
    provider &&
    (error instanceof UnsupportedChainIdError ||
      chainId !== DEFAULT_TO_CHAIN_ID);

  // Update pool info when token changes
  useEffect(() => {
    setLoadingPoolState(true);

    poolClient.updatePool(token.bridgePool).then((res) => {
      setLoadingPoolState(false);
    });
  }, [token, setLoadingPoolState]);

  useEffect(() => {
    if (isConnected && connection.account && token.bridgePool) {
      poolClient.updateUser(connection.account, token.bridgePool);
    }
  }, [isConnected, connection.account, token.bridgePool]);

  useEffect(() => {
    // Recheck for balances. note: Onboard provider is faster than ours.
    if (depositUrl) {
      setTimeout(() => {
        refetchBalance();
      }, 15000);
    }
  }, [depositUrl, refetchBalance]);

  return (
    <Layout>
      {!showSuccess ? (
        <Wrapper>
          <PoolSelection
            wrongNetwork={wrongNetwork}
            token={token}
            setToken={setToken}
          />
          {!loadingPoolState ? (
            <PoolForm
              wrongNetwork={wrongNetwork}
              symbol={token.symbol}
              icon={token.logoURI}
              decimals={token.decimals}
              tokenAddress={token.address}
              totalPoolSize={
                pool && pool.totalPoolSize
                  ? ethers.BigNumber.from(pool.totalPoolSize)
                  : ethers.BigNumber.from("0")
              }
              apy={
                pool && pool.estimatedApy
                  ? `${Number(pool.estimatedApy) * 100}`
                  : "0"
              }
              projectedApr={
                pool && pool.projectedApr
                  ? `${Number(pool.projectedApr) * 100}`
                  : "0"
              }
              position={
                userPosition
                  ? ethers.BigNumber.from(userPosition.totalDeposited)
                  : ethers.BigNumber.from("0")
              }
              feesEarned={
                userPosition
                  ? max(ethers.BigNumber.from(userPosition.feesEarned), 0)
                  : ethers.BigNumber.from("0")
              }
              totalPosition={
                userPosition
                  ? ethers.BigNumber.from(userPosition.positionValue)
                  : ethers.BigNumber.from("0")
              }
              lpTokens={
                userPosition
                  ? ethers.BigNumber.from(userPosition.lpTokens)
                  : ethers.BigNumber.from("0")
              }
              bridgeAddress={token.bridgePool}
              ethBalance={
                account
                  ? // Very odd key assigned to these values.
                    queries[`ethBalance({"account":"${account}","chainId":1})`]
                  : null
              }
              erc20Balances={
                account
                  ? queries[`balances({"account":"${account}","chainId":1})`]
                  : null
              }
              setShowSuccess={setShowSuccess}
              setDepositUrl={setDepositUrl}
              balance={balance.toString()}
              refetchBalance={refetchBalance}
              defaultTab={defaultTab}
              setDefaultTab={setDefaultTab}
              utilization={
                pool && pool.liquidityUtilizationCurrent
                  ? pool.liquidityUtilizationCurrent
                  : "0"
              }
            />
          ) : (
            <LoadingWrapper>
              <LoadingInfo>
                <LoadingLogo src={token.logoURI} />
                <InfoText>{token.symbol} Pool</InfoText>
                <BouncingDotsLoader type={"big" as BounceType} />
              </LoadingInfo>
              <LoadingPositionWrapper />
              <BigLoadingPositionWrapper />
            </LoadingWrapper>
          )}
        </Wrapper>
      ) : (
        <DepositSuccess
          depositUrl={depositUrl}
          setShowSuccess={setShowSuccess}
          showSuccess={showSuccess}
          setDepositUrl={setDepositUrl}
        />
      )}
    </Layout>
  );
};
export default Pool;

const Wrapper = styled.div`
  padding-bottom: 50px;
  height: calc(100% - 50px);
  display: flex;
  flex-direction: column;
  @media ${QUERIES.tabletAndUp} {
    padding-bottom: 0;
    height: 100%;
  }
`;

const LoadingWrapper = styled.div`
  flex: 1;
  background-color: var(--color-primary);
  border-radius: 12px 12px 0 0;
`;

const LoadingInfo = styled.div`
  text-align: center;
`;

const LoadingLogo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 10px;
  background-color: var(--color-white);
  border-radius: 16px;
  padding: 4px;
  margin-top: 12px;
`;

const InfoText = styled.h3`
  font-size: ${24 / 16}rem;
  color: var(--color-gray);
  margin-bottom: 16px;
`;

const LoadingPositionWrapper = styled.div`
  background-color: hsla(${COLORS.gray[500]} / 0.2);
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  padding: 16px;
  border-radius: 5px;
  min-height: 64px;
  margin-top: 20px;
`;

const BigLoadingPositionWrapper = styled(LoadingPositionWrapper)`
  min-height: 320px;
  margin-top: 32px;
`;
