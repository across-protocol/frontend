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
  onDeposit: (deposit: Deposit) => void;
};
const SendForm: React.FC<Props> = ({ onDeposit }) => {
  return (
    <SendFormProvider>
      <Layout>
        <ChainSelection />
        <CoinSelection />
        <AddressSelection />
        <SendAction onDeposit={onDeposit} />
      </Layout>
    </SendFormProvider>
  );
};

export default SendForm;
