import { useState, useEffect, Suspense } from "react";
import {
  Switch,
  Route,
  useLocation,
  useHistory,
  Redirect,
} from "react-router-dom";
import { Header, SuperHeader, Banner, Sidebar } from "components";
import { useConnection, useError } from "hooks";
import styled from "@emotion/styled";
import {
  disableDeposits,
  enableMigration,
  WrongNetworkError,
  rewardsBannerWarning,
  generalMaintenanceMessage,
  stringValueInArray,
  getConfig,
  chainEndpointToId,
} from "utils";
import lazyWithRetry from "utils/lazy-with-retry";
import { ReactComponent as InfoLogo } from "assets/icons/info.svg";
import Toast from "components/Toast";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import NotFound from "./views/NotFound";
import ScrollToTop from "components/ScrollToTop";
import { AmpliTrace } from "components/AmpliTrace";

const LiquidityPool = lazyWithRetry(
  () => import(/* webpackChunkName: "LiquidityPools" */ "./views/LiquidityPool")
);
const OPRebates = lazyWithRetry(
  () =>
    import(
      /* webpackChunkName: "OPRebates" */ "./views/RewardsProgram/OPRebatesProgram"
    )
);
const ARBRebates = lazyWithRetry(
  () =>
    import(
      /* webpackChunkName: "ARBRebates" */ "./views/RewardsProgram/ARBRebatesProgram"
    )
);
const Rewards = lazyWithRetry(
  () => import(/* webpackChunkName: "Rewards" */ "./views/Rewards")
);
const Send = lazyWithRetry(
  () => import(/* webpackChunkName: "Send" */ "./views/Bridge")
);
const Transactions = lazyWithRetry(
  () => import(/* webpackChunkName: "Transactions" */ "./views/Transactions")
);
const Staking = lazyWithRetry(
  () => import(/* webpackChunkName: "RewardStaking" */ "./views/Staking")
);
const DepositStatus = lazyWithRetry(() => import("./views/DepositStatus"));

const warningMessage = `
  We noticed that you have connected from a contract address.
  We recommend that you change the destination of the transfer (by clicking the "Change account" text below the To dropdown)
  to a non-contract wallet you control on the destination chain to avoid having your funds lost or stolen.
`;

function useRoutes() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [enableACXBanner, setEnableACXBanner] = useState(true);
  const { provider, isContractAddress } = useConnection();
  const location = useLocation();
  const history = useHistory();
  const { error, removeError } = useError();
  const config = getConfig();
  // force the user on /pool page if showMigrationPage is active.

  // This UseEffect performs the following operations:
  //    1. Force the user to /pool if showMigrationPage is active
  //    2. If the pathname is /airdrop set the transparent header
  useEffect(() => {
    if (enableMigration && location.pathname !== "/pool") {
      history.push("/pool");
    }
  }, [location.pathname, history]);

  return {
    openSidebar,
    setOpenSidebar,
    provider,
    error,
    removeError,
    location,
    isAirdrop: location.pathname === "/airdrop",
    isHomepage: location.pathname === "/",
    isContractAddress,
    config,
    enableACXBanner,
    setEnableACXBanner,
  };
}
// Need this component for useLocation hook
const Routes: React.FC = () => {
  const {
    openSidebar,
    setOpenSidebar,
    error,
    removeError,
    location,
    config,
    isContractAddress,
    isAirdrop,
    isHomepage,
  } = useRoutes();

  return (
    <>
      <AmpliTrace />
      {generalMaintenanceMessage && (
        <SuperHeader size="lg">{generalMaintenanceMessage}</SuperHeader>
      )}
      {disableDeposits && (
        <SuperHeader>
          Across is experiencing issues. Deposits are currently disabled into
          the pools. Please try again later
        </SuperHeader>
      )}
      {error && !(error instanceof WrongNetworkError) && (
        <SuperHeader>
          <div>{error.message}</div>
          <RemoveErrorSpan onClick={() => removeError()}>X</RemoveErrorSpan>
        </SuperHeader>
      )}
      {rewardsBannerWarning && location.pathname === "/rewards" && (
        <Banner>
          <InfoLogo />
          <span>
            Due to maintenance, rewards will not be visually updated for a few
            hours. This does not impact your reward earnings.
          </span>
        </Banner>
      )}
      {isContractAddress && (
        <SuperHeader size="lg">{warningMessage}</SuperHeader>
      )}
      <Header
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
        transparentHeader={isAirdrop || isHomepage}
      />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <ScrollToTop />
      <Suspense fallback={<BouncingDotsLoader />}>
        <Switch>
          <Route exact path="/transactions" component={Transactions} />
          <Route exact path="/pool" component={LiquidityPool} />
          <Route
            exact
            path="/rewards/optimism-grant-program"
            component={OPRebates}
          />
          <Route
            exact
            path="/rewards/arbitrum-grant-program"
            component={ARBRebates}
          />
          <Route exact path="/rewards" component={Rewards} />
          <Route
            exact
            path="/rewards/staking/:poolId"
            render={({ match }) => {
              const poolIdFound = stringValueInArray(
                match.params.poolId.toLowerCase(),
                config.getPoolSymbols()
              );

              if (poolIdFound) {
                return <Staking />;
              } else {
                return <NotFound custom404Message="Pool not found." />;
              }
            }}
          />
          <Route exact path="/bridge" component={Send} />
          <Route path="/bridge/:depositTxHash" component={DepositStatus} />
          <Redirect
            exact
            path="/"
            to={{
              pathname: "/bridge",
              search: location.search,
            }}
          />
          {Object.values(chainEndpointToId).flatMap(
            ({ chainId, associatedProjectIds, vanity }) => [
              vanity.map((v) => (
                <Route key={v} exact path={`/${v}`} render={() => <Send />} />
              )),
              associatedProjectIds.map((projectId) => (
                <Route
                  key={`${chainId}:${projectId}`}
                  exact
                  path={`/${projectId}`}
                  render={() => <Send />}
                />
              )),
            ]
          )}
          <Route
            path="*"
            render={() => <NotFound custom404Message="page not found" />}
          />
        </Switch>
      </Suspense>
      <Toast position="top-right" />
    </>
  );
};

export default Routes;

const RemoveErrorSpan = styled.span`
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
`;
