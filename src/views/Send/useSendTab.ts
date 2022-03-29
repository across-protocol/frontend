import { useState } from "react";
import { Deposit } from "../Confirmation";

export default function useSendTab() {
  const [showConfirmationScreen, setShow] = useState(false);
  const [deposit, setDeposit] = useState<Deposit>();
  const onCloseConfirmationScreen = () => setShow(false);
  const onDepositConfirmed = (deposit: Deposit) => {
    setDeposit(deposit);
    setShow(true);
  };
  return {
    showConfirmationScreen,
    deposit,
    onDepositConfirmed,
    onCloseConfirmationScreen,
  };
}
