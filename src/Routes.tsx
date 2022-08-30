import { useState, useEffect } from "react";
import { Switch, Route, useLocation, useHistory } from "react-router-dom";

import {
  Send,
  Pool,
  About,
  MyTransactions,
  Rewards,
  Staking,
  Claim,
  NotFound,
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
  stringValueInArray,
  getConfig,
} from "utils";
import { ReactComponent as InfoLogo } from "assets/icons/info-24.svg";
import Toast from "components/Toast";

function useRoutes() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const { provider } = useConnection();
  const location = useLocation();
  const history = useHistory();
  const { error, removeError } = useError();
  const config = getConfig();
  // force the user on /pool page if showMigrationPage is active.
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
    config,
  };
}
// Need this component for useLocation hook
const Routes: React.FC = () => {
  const { openSidebar, setOpenSidebar, error, removeError, location, config } =
    useRoutes();
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
      <Header openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Switch>
        <Route exact path="/transactions" component={MyTransactions} />
        <Route exact path="/pool" component={Pool} />
        <Route exact path="/about" component={About} />
        <Route exact path="/rewards" component={Rewards} />
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
