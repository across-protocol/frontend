import { FC, useState, useEffect } from "react";
import { ethers } from "ethers";
import Layout from "components/Layout";
import PoolSelection from "components/PoolSelection";
import PoolForm from "components/PoolForm";
import DepositSuccess from "components/PoolForm/DepositSuccess";
import {
  ChainId,
  UnsupportedChainIdError,
  COLORS,
  QUERIES,
  max,
  switchChain,
  getChainInfo,
  AddressZero,
  getConfig,
} from "utils";
import { useAppSelector, useBalance } from "state/hooks";
import { useConnection, useQueryParams } from "hooks";
import get from "lodash/get";
import { getPoolClient } from "state/poolsApi";
import styled from "@emotion/styled";
import BouncingDotsLoader from "components/BouncingDotsLoader";

import { BounceType } from "components/BouncingDotsLoader/BouncingDotsLoader";
import { SuperHeader } from "components";
import { migrationPoolV2Warning } from "utils";

export type ShowSuccess = "deposit" | "withdraw";

const Pool: FC = () => {
  const poolClient = getPoolClient();
  // casting chainId to ChainId as the pool client does not share that type. We validate it before setting the config in client.
  const { chainId = 1, hubPoolAddress } = poolClient.config as {
    chainId: ChainId;
    hubPoolAddress: string;
  };
  const config = getConfig();
  const tokenList = config.getTokenList(chainId);
  const chainInfo = getChainInfo(chainId);
  const [token, setToken] = useState(tokenList[0]);
  const [showSuccess, setShowSuccess] = useState<ShowSuccess | undefined>();
  const [depositUrl, setDepositUrl] = useState("");
  const [loadingPoolState, setLoadingPoolState] = useState(false);
  const [defaultTab, setDefaultTab] = useState("Add");

  // Enable deep linking on the pool to access a specific pool symbol
  const { symbol: queryPoolSymbol } = useQueryParams();
  useEffect(() => {
    const resolvedToken = tokenList.find(
      (token) =>
        queryPoolSymbol &&
        token.symbol.toLowerCase() === queryPoolSymbol.toLowerCase()
    );
    if (resolvedToken && token.symbol !== resolvedToken.symbol) {
      setToken(resolvedToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    isConnected,
    account,
    provider,
    error,
    chainId: activeChainId,
  } = useConnection();
  const pool = useAppSelector(
    (state) =>
      state.pools.pools[
        token.address === AddressZero
          ? poolClient.config.wethAddress
          : token.address
      ]
  );
  const userPosition = useAppSelector((state) =>
    get(state, [
      "pools",
      "users",
      account || "",
      token.address === AddressZero
        ? poolClient.config.wethAddress
        : token.address,
    ])
  );

  const queries = useAppSelector((state) => state.api.queries);

  const { balance, refetch: refetchBalance } = useBalance({
    chainId,
    account,
    token,
  });

  const wrongNetwork =
    provider &&
    (error instanceof UnsupportedChainIdError || chainId !== activeChainId);

  // Update pool info when token changes
  useEffect(() => {
    setLoadingPoolState(true);
    const address =
      token.address === AddressZero
        ? poolClient.config.wethAddress
        : token.address;
    poolClient
      .updatePool(address)
      .catch((err) => {
        console.error("Unable to load pool info", err);
      })
      .finally(() => {
        setLoadingPoolState(false);
        refetchBalance();
      });
  }, [token, setLoadingPoolState, poolClient, refetchBalance]);

  useEffect(() => {
    if (isConnected && account && token.address) {
      const address =
        token.address === AddressZero
          ? poolClient.config.wethAddress
          : token.address;
      poolClient
        .updateUser(account, address)
        .catch((err) => console.error("error loading user", err));
    }
  }, [isConnected, account, token.address, poolClient]);

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
      {wrongNetwork && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={() => switchChain(provider, chainId)}>
              switch to {chainInfo.name}
            </button>
          </div>
        </SuperHeader>
      )}
      {!showSuccess ? (
        <Wrapper>
          {migrationPoolV2Warning && (
            <MigrationWarning>
              <div>
                If you have not migrated liquidity from Across v1 to Across v2,
                please follow{" "}
                <a
                  href="https://medium.com/across-protocol/lps-migrate-liquidity-from-v1-to-v2-screenshots-and-faqs-8616150b3396"
                  target="_blank"
                  rel="noreferrer"
                >
                  {" "}
                  these instructions
                </a>{" "}
              </div>
            </MigrationWarning>
          )}
          <PoolSelection
            tokenList={tokenList}
            wrongNetwork={wrongNetwork}
            token={token}
            setToken={setToken}
            chainId={chainId}
          />
          {!loadingPoolState ? (
            <PoolForm
              chainId={chainId}
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
                  ? ethers.BigNumber.from(userPosition.positionValue)
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
              hubPoolAddress={hubPoolAddress}
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
  height: 100%;
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

const MigrationWarning = styled.div`
  z-index: 1000;
  display: flex;
  padding: 1rem 0;
  > div {
    text-align: center;
    border-radius: 5px;
    background-color: var(--color-error);
    color: var(--color-gray);
    width: 90%;
    height: 70px;
    margin: 0 auto;
    padding: 1rem 0.5rem;
    font-size: ${14 / 16}rem;
    line-height: ${19 / 16}rem;
  }
`;
