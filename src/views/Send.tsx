import React from "react";
import {
  Layout,
  ChainSelection,
  CoinSelection,
  AddressSelection,
  SendAction,
} from "components";

const Send: React.FC = () => {
  return (
    <Layout>
      <ChainSelection />
      <CoinSelection />
      <AddressSelection />
      <SendAction />
    </Layout>
  );
};

export default Send;
