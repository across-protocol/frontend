import { useState, useEffect } from "react";
import { Switch, Route, useLocation, useHistory } from "react-router-dom";
import {
  Send,
  Pool,
  About,
  MyTransactions,
  Rewards,
  Claim,
  NotFound,
  PreLaunchAirdrop,
} from "views";
import { Header, SuperHeader, Banner, Sidebar } from "components";
import { useConnection } from "state/hooks";
import { useError } from "hooks";
import styled from "@emotion/styled";
import {
  disableDeposits,
  enableMigration,
  WrongNetworkError,
  rewardsBannerWarning,
  arbitrumDisabled,
} from "utils";
import { ReactComponent as InfoLogo } from "assets/icons/info-24.svg";
import Toast from "components/Toast";

function useRoutes() {
  const [transparentHeader, setTransparentHeader] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const { provider } = useConnection();
  const location = useLocation();
  const history = useHistory();
  const { error, removeError } = useError();

  // This UseEffect performs the following operations:
  //    1. Force the user to /pool if showMigrationPage is active
  //    2. If the pathname is /airdrop set the transparent header
  useEffect(() => {
    if (enableMigration && location.pathname !== "/pool") {
      history.push("/pool");
    }
    setTransparentHeader(location.pathname === "/airdrop");
  }, [location.pathname, history]);

  return {
    openSidebar,
    setOpenSidebar,
    provider,
    error,
    removeError,
    location,
    transparentHeader,
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
    transparentHeader,
  } = useRoutes();
  return (
    <>
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
      {arbitrumDisabled && (
        <SuperHeader>
          <div>
            Routes to and from Arbitrum are temporarily disabled due to the
            Arbitrum Nitro upgrade. Once the upgrade is over, these routes will
            be re-enabled. Note:{" "}
            <a
              href="https://twitter.com/arbitrum/status/1564370880880381952"
              target="_blank"
              rel="noreferrer"
            >
              According to the Arbitrum team this process should last 2-4 hours.
            </a>
          </div>
        </SuperHeader>
      )}{" "}
      <Header
        transparentHeader={transparentHeader}
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Switch>
        <Route exact path="/transactions" component={MyTransactions} />
        <Route exact path="/pool" component={Pool} />
        <Route exact path="/about" component={About} />
        <Route exact path="/rewards" component={Rewards} />
        <Route exact path="/rewards/claim" component={Claim} />
        <Route exact path="/airdrop" component={PreLaunchAirdrop} />
        <Route exact path="/" component={Send} />
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
