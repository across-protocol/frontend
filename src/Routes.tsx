import { useState, useEffect, Suspense } from "react";
import { Switch, Route, useLocation, useHistory } from "react-router-dom";
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
} from "utils";
import lazyWithRetry from "utils/lazy-with-retry";
import { ReactComponent as InfoLogo } from "assets/icons/info-24.svg";
import Toast from "components/Toast";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import NotFound from "./views/NotFound";
import ACXLiveBanner from "components/ACXLiveBanner/ACXLiveBanner";
import ScrollToTop from "components/ScrollToTop";
import { AmpliTrace } from "components/AmpliTrace";

const LiquidityPool = lazyWithRetry(
  () => import(/* webpackChunkName: "LiquidityPools" */ "./views/LiquidityPool")
);
const Referrals = lazyWithRetry(
  () => import(/* webpackChunkName: "Referrals" */ "./views/Referrals")
);
const Rewards = lazyWithRetry(
  () => import(/* webpackChunkName: "Rewards" */ "./views/Rewards")
);
const Send = lazyWithRetry(
  () => import(/* webpackChunkName: "Send" */ "./views/Bridge")
);
const Splash = lazyWithRetry(
  () => import(/* webpackChunkName: "Splash" */ "./views/Splash")
);
const Airdrop = lazyWithRetry(() => import("./views/Airdrop"));
const MyTransactions = lazyWithRetry(
  () =>
    import(
      /* webpackChunkName: "MyTransactions" */ "./views/Transactions/myTransactions"
    )
);
const AllTransactions = lazyWithRetry(
  () =>
    import(
      /* webpackChunkName: "AllTransactions" */ "./views/Transactions/allTransactions"
    )
);
const Staking = lazyWithRetry(
  () => import(/* webpackChunkName: "RewardStaking" */ "./views/Staking")
);

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
    enableACXBanner,
    setEnableACXBanner,
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
      {!isAirdrop && enableACXBanner && (
        <ACXLiveBanner enableHandler={setEnableACXBanner} />
      )}
      <SuperHeader>
        <Banner>
          <InfoLogo />
          <span>
            Starting at 10 AM ET on April 25th, Across bridging functionality
            will be paused for a minimum of 4 hours for a planned protocol
            upgrade. See{" "}
            <a
              style={{ color: "inherit" }}
              href="https://twitter.com/AcrossProtocol?s=20"
            >
              Across Twitter
            </a>{" "}
            for more info.
          </span>
        </Banner>
      </SuperHeader>
      <Header
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
        transparentHeader={isAirdrop || isHomepage}
      />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <ScrollToTop />
      <Suspense fallback={<BouncingDotsLoader />}>
        <Switch>
          <Route exact path="/transactions" component={MyTransactions} />
          <Route exact path="/transactions/all" component={AllTransactions} />
          <Route exact path="/pool" component={LiquidityPool} />
          <Route exact path="/rewards/referrals" component={Referrals} />
          <Route exact path="/rewards" component={Rewards} />
          <Route exact path="/airdrop" component={Airdrop} />
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
          <Route exact path="/" component={Splash} />
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
