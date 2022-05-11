import React from "react";
import SendForm from "components/SendForm";
import Confirmation from "../Confirmation";
import useSendTab from "./useSendTab";
import { SendFormProvider } from "hooks";
import { trackPageView } from "utils";

const SendTab: React.FC = () => {
  const {
    showConfirmationScreen,
    deposit,
    onCloseConfirmationScreen,
    onDepositConfirmed,
  } = useSendTab();

  // Track page views of the Send tab
  React.useEffect(() => {
    trackPageView({
      documentTitle: "Send",
      href: "https://across.to",
    });
  }, []);

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
