import React from "react";
import {
  Layout,
  ChainSelection,
  CoinSelection,
  AddressSelection,
  SendAction,
} from "components";
import { useSendForm } from "hooks";
import type { Deposit } from "views/Confirmation";
import SuperHeader from "components/SuperHeader";
import { useConnection } from "state/hooks";
import { CHAINS, switchChain } from "utils";

type Props = {
  onDepositConfirmed: (deposit: Deposit) => void;
};
const SendForm: React.FC<Props> = ({ onDepositConfirmed }) => {
  const { fromChain } = useSendForm();
  const { chainId, provider } = useConnection();
  const showError = !!chainId && provider && chainId !== fromChain;
  return (
    <>
      {showError && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={() => switchChain(provider, fromChain)}>
              switch to {CHAINS[fromChain].name}
            </button>
          </div>
        </SuperHeader>
      )}
      <Layout>
        <ChainSelection />
        <CoinSelection />
        <AddressSelection />
        <SendAction onDeposit={onDepositConfirmed} />
      </Layout>
    </>
  );
};

export default SendForm;
