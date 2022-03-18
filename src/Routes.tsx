import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "react-router-dom";
import { Send, Pool, About, Transactions } from "views";
import { Header, SuperHeader } from "components";
import { useConnection } from "state/hooks";
import { CHAINS, switchChain, WrongNetworkError } from "utils";
import { useError, usePrevious } from "hooks";
import styled from "@emotion/styled";
import Sidebar from "components/Sidebar";

function useRoutes() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const { provider } = useConnection();
  const location = useLocation();
  const { error, removeError } = useError();

  // reset wrong chain error on route change
  const prevLocation = usePrevious(location);
  useEffect(() => {
    if (
      error instanceof WrongNetworkError &&
      prevLocation.pathname !== location.pathname
    ) {
      removeError();
    }
  }, [removeError, error, location.pathname, prevLocation.pathname]);
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
  const { openSidebar, setOpenSidebar, error, removeError, provider } =
    useRoutes();
  const showError = provider && error instanceof WrongNetworkError;
  return (
    <>
      {error && !(error instanceof WrongNetworkError) && (
        <SuperHeader>
          <div>{error.message}</div>
          <RemoveErrorSpan onClick={() => removeError()}>X</RemoveErrorSpan>
        </SuperHeader>
      )}
      {showError && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={() => switchChain(provider, error.correctChainId)}>
              switch to {CHAINS[error.correctChainId].name}
            </button>
          </div>
        </SuperHeader>
      )}
      <Header openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Switch>
        <Route exact path="/transactions" component={Transactions} />
        <Route exact path="/pool" component={Pool} />
        <Route exact path="/about" component={About} />
        <Route exact path="/" component={Send} />
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
