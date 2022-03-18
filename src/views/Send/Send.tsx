import React from "react";
import SendForm from "components/SendForm";
import Confirmation from "../Confirmation";
import useSendTab from "./useSendTab";

const SendTab: React.FC = () => {
  const {
    showConfirmationScreen,
    deposit,
    onCloseConfirmationScreen,
    onDepositConfirmed,
  } = useSendTab();

  if (showConfirmationScreen) {
    return (
      <Confirmation deposit={deposit} onClose={onCloseConfirmationScreen} />
    );
  }
  return <SendForm onDepositConfirmed={onDepositConfirmed} />;
};

export default SendTab;
