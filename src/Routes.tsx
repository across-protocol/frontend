import { useState } from "react";
import { Switch, Route, useLocation } from "react-router-dom";
import { Send, Confirmation, Pool, About, Transactions } from "views";
import { Header, SuperHeader } from "components";
import { useConnection, useDeposits } from "state/hooks";
import { CHAINS, UnsupportedChainIdError, switchChain, ChainId } from "utils";

import { useAppSelector } from "state/hooks";
import { useError } from "hooks";
import styled from "@emotion/styled";
import Sidebar from "components/Sidebar";

// Need this component for useLocation hook
const Routes: React.FC = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const { showConfirmationScreen } = useDeposits();
  const { provider, chainId, error } = useConnection();
  const location = useLocation();
  const sendState = useAppSelector((state) => state.send);
  const { error: globalError, removeError } = useError();

  const wrongNetworkSend =
    provider &&
    chainId &&
    location.pathname === "/" &&
    (error instanceof UnsupportedChainIdError ||
      chainId !== sendState.currentlySelectedFromChain.chainId);
  const wrongNetworkPool =
    provider &&
    !!chainId &&
    location.pathname === "/pool" &&
    (error instanceof UnsupportedChainIdError || chainId !== ChainId.MAINNET);

  return (
    <>
      {globalError && (
        <SuperHeader>
          <div>{globalError}</div>
          <RemoveErrorSpan onClick={() => removeError()}>X</RemoveErrorSpan>
        </SuperHeader>
      )}
      {wrongNetworkSend && location.pathname === "/" && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button
              onClick={() =>
                switchChain(
                  provider,
                  sendState.currentlySelectedFromChain.chainId
                )
              }
            >
              switch to{" "}
              {CHAINS[sendState.currentlySelectedFromChain.chainId].name}
            </button>
          </div>
        </SuperHeader>
      )}

      {wrongNetworkPool && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={() => switchChain(provider, ChainId.MAINNET)}>
              switch to {CHAINS[ChainId.MAINNET].name}
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
        <Route
          exact
          path="/"
          component={showConfirmationScreen ? Confirmation : Send}
        />
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
