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
} from "utils";
import { ReactComponent as InfoLogo } from "assets/icons/info-24.svg";
import Toast from "components/Toast";
const warningMessage = `Warning --- We noticed your connected account is a contract address.

1. Usually the same contract will not exist on the destination. You must change the destination address to avoid loss of funds. If not, your funds may be locked or stolen.

2. When bridging ETH to a contract address, ETH will be wrapped into WETH. Ensure the contract address can receive WETH. If you are not sure whether it can, then you should send to a non-contract address to be safe and receive ETH to prevent any chance of a loss of funds.

To change the destination address, click the Change account button below the To dropdown and paste in the address that you would like to receive the funds on the other chain.
`;

function useRoutes() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const { provider, isContractAddress } = useConnection();
  const location = useLocation();
  const history = useHistory();
  const { error, removeError } = useError();
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
    isContractAddress,
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
    isContractAddress,
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
      {isContractAddress && <SuperHeader>{warningMessage}</SuperHeader>}
      <SuperHeader darkMode size="lg">
        <i>USDT currently disabled for Across contract upgrade.</i>
      </SuperHeader>
      <Header openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Switch>
        <Route exact path="/transactions" component={MyTransactions} />
        <Route exact path="/pool" component={Pool} />
        <Route exact path="/about" component={About} />
        <Route exact path="/rewards" component={Rewards} />
        <Route exact path="/rewards/claim" component={Claim} />
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
