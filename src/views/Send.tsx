import React from "react";
import {
  Layout,
  ChainSelection,
  CoinSelection,
  AddressSelection,
  SendAction,
} from "components";
import { SendFormProvider } from "hooks";

const Send: React.FC = () => {
  return (
    <Layout>
      <SendFormProvider>
        <ChainSelection />
        <CoinSelection />
        <AddressSelection />
        <SendAction />
      </SendFormProvider>
    </Layout>
  );
};

export default Send;
