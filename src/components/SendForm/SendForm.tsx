import React from "react";
import {
  Layout,
  ChainSelection,
  CoinSelection,
  AddressSelection,
  SendAction,
} from "components";
import { SendFormProvider } from "hooks";
import type { Deposit } from "views/Confirmation";

type Props = {
  onDepositConfirmed: (deposit: Deposit) => void;
};
const SendForm: React.FC<Props> = ({ onDepositConfirmed }) => {
  return (
    <SendFormProvider>
      <Layout>
        <ChainSelection />
        <CoinSelection />
        <AddressSelection />
        <SendAction onDeposit={onDepositConfirmed} />
      </Layout>
    </SendFormProvider>
  );
};

export default SendForm;
