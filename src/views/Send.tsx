import React, { useState } from "react";
import SendForm from "components/SendForm";
import Confirmation, { Deposit } from "./Confirmation";

function useSend() {
  const [showConfirmationScreen, setShow] = useState(false);
  const [deposit, setDeposit] = useState<Deposit>();
  const onCloseConfirmationScreen = () => setShow(false);
  const onDeposit = (deposit: Deposit) => {
    setDeposit(deposit);
    setShow(true);
  };
  return {
    showConfirmationScreen,
    deposit,
    onDeposit,
    onCloseConfirmationScreen,
  };
}

const Send: React.FC = () => {
  const {
    showConfirmationScreen,
    deposit,
    onCloseConfirmationScreen,
    onDeposit,
  } = useSend();

  if (showConfirmationScreen) {
    return (
      <Confirmation deposit={deposit} onClose={onCloseConfirmationScreen} />
    );
  }
  return <SendForm onDeposit={onDeposit} />;
};

export default Send;
