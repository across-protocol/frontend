import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation, useHistory } from "react-router-dom";
import { Header, SuperHeader, Banner, Sidebar } from "components";
import { useConnection } from "hooks";
import { useError } from "hooks";
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
import { ReactComponent as InfoLogo } from "assets/icons/info-24.svg";
import Toast from "components/Toast";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import NotFound from "./views/NotFound";

const Pool = lazy(() => import(/* webpackChunkName: "Pool" */ "./views/Pool"));
const Referrals = lazy(
  () => import(/* webpackChunkName: "Rewards" */ "./views/Referrals")
);
const Send = lazy(() => import(/* webpackChunkName: "Send" */ "./views/Send"));
const About = lazy(
  () => import(/* webpackChunkName: "About" */ "./views/About")
);
const Claim = lazy(
  () => import(/* webpackChunkName: "Claim" */ "./views/Claim")
);
const MyTransactions = lazy(
  () =>
    import(
      /* webpackChunkName: "MyTransactions" */ "./views/Transactions/myTransactions"
    )
);
const AllTransactions = lazy(
  () =>
    import(
      /* webpackChunkName: "AllTransactions" */ "./views/Transactions/allTransactions"
    )
);

const Staking = lazy(
  () => import(/* webpackChunkName: "RewardStaking" */ "./views/Staking")
);

const warningMessage = `
  We noticed that you have connected from a contract address.
  We recommend that you change the destination of the transfer (by clicking the "Change account" text below the To dropdown)
  to a non-contract wallet you control on the destination chain to avoid having your funds lost or stolen.
`;

function useRoutes() {
  const [transparentHeader] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
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
    // setTransparentHeader(location.pathname === "/airdrop");
  }, [location.pathname, history]);

  return {
    openSidebar,
    setOpenSidebar,
    provider,
    error,
    removeError,
    location,
    transparentHeader,
    isContractAddress,
    config,
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
    transparentHeader,
  } = useRoutes();

  return (
    <>
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
        transparentHeader={transparentHeader}
      />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Switch>
        <Suspense fallback={<BouncingDotsLoader />}>
          <Route exact path="/transactions" component={MyTransactions} />
          <Route exact path="/transactions/all" component={AllTransactions} />
          <Route exact path="/pool" component={Pool} />
          <Route exact path="/about" component={About} />
          <Route exact path="/rewards/referrals" component={Referrals} />
          <Route exact path="/rewards/claim" component={Claim} />
          <Route exact path="/airdrop" component={Claim} />
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
          <Route exact path="/" component={Send} />
        </Suspense>
        <Route path="*" component={NotFound} />
      </Switch>
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
