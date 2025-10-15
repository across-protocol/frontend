import { useState, useEffect, Suspense } from "react";
import {
  Switch,
  Route,
  useLocation,
  useHistory,
  Redirect,
} from "react-router-dom";
import { Header, Sidebar } from "components";
import { useConnection, useError } from "hooks";
import { stringValueInArray, getConfig, chainEndpointToId } from "utils";
import lazyWithRetry from "utils/lazy-with-retry";
import { enableMigration } from "utils";
import Toast from "components/Toast";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import NotFound from "./views/NotFound";
import ScrollToTop from "components/ScrollToTop";
import { AmpliTrace } from "components/AmpliTrace";
import Banners from "components/Banners";

export const NAVIGATION_LINKS = !enableMigration
  ? [
      { href: "/bridge-and-swap", name: "Bridge & Swap" },
      { href: "/pool", name: "Pool" },
      { href: "/rewards", name: "Rewards" },
      { href: "/transactions", name: "Transactions" },
    ]
  : [];

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
const SwapAndBridge = lazyWithRetry(
  () => import(/* webpackChunkName: "RewardStaking" */ "./views/SwapAndBridge")
);
const DepositStatus = lazyWithRetry(() => import("./views/DepositStatus"));

function useRoutes() {
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
      <Banners
        networkError={error}
        onClickNetworkError={() => removeError()}
        isContractAddress={isContractAddress}
      />
      <Header transparentHeader={isAirdrop || isHomepage} />
      <Sidebar />
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
          <Route exact path="/bridge-and-swap" component={SwapAndBridge} />
          <Route
            path="/bridge-and-swap/:depositTxHash"
            component={DepositStatus}
          />
          <Redirect
            exact
            path="/"
            to={{
              pathname: "/bridge-and-swap",
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
