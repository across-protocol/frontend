import React from "react";
import {
  Layout,
  ChainSelection,
  CoinSelection,
  AddressSelection,
  SendAction,
  SuperHeader,
} from "components";
import type { Deposit } from "views/Confirmation";
import { getChainInfo, switchChain } from "utils";
import useSendFormComponent from "./useSendFormComponent";

type Props = {
  onDepositConfirmed: (deposit: Deposit) => void;
};
const SendForm: React.FC<Props> = ({ onDepositConfirmed }) => {
  const { fromChain, provider, wrongNetwork } = useSendFormComponent();

  return (
    <>
      {wrongNetwork && provider && fromChain && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={() => switchChain(provider, fromChain)}>
              switch to {getChainInfo(fromChain).name}
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
