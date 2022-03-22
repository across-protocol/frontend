import React from "react";
import SendForm from "components/SendForm";
import Confirmation from "../Confirmation";
import useSendTab from "./useSendTab";
import { SendFormProvider } from "hooks";

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
  return (
    <SendFormProvider>
      <SendForm onDepositConfirmed={onDepositConfirmed} />
    </SendFormProvider>
  );
};

export default SendTab;
