import React from "react";
import { Confirmation, SendForm, Layout } from "components";
import { useTransfers } from "state/hooks";

const Send: React.FC = () => {
  const {
    showLatestTransfer,
    latestTransfer,
    toggleShowLatestTransfer,
    addTransfer,
  } = useTransfers();

  return (
    <Layout>
      {showLatestTransfer && latestTransfer ? (
        <Confirmation onClose={toggleShowLatestTransfer} {...latestTransfer} />
      ) : (
        <SendForm onSend={addTransfer} />
      )}
    </Layout>
  );
};

export default Send;
