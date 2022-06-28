import { useState, useEffect } from "react";
import { Switch, Route, useLocation, useHistory } from "react-router-dom";
import { Send, Pool, About, Transactions, Rewards } from "views";
import { Header, SuperHeader } from "components";
import { useConnection } from "state/hooks";
import { WrongNetworkError } from "utils";
import { useError } from "hooks";
import styled from "@emotion/styled";
import Sidebar from "components/Sidebar";
import { disableDeposits } from "utils";
import { enableMigration } from "utils";

function useRoutes() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const { provider } = useConnection();
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
  };
}
// Need this component for useLocation hook
const Routes: React.FC = () => {
  const { openSidebar, setOpenSidebar, error, removeError } = useRoutes();

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

      <Header openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Switch>
        <Route exact path="/transactions" component={Transactions} />
        <Route exact path="/pool" component={Pool} />
        <Route exact path="/about" component={About} />
        <Route exact path="/rewards" component={Rewards} />
        <Route path="/" component={Send} />
      </Switch>
    </>
  );
};

export default Routes;

const RemoveErrorSpan = styled.span`
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
`;
