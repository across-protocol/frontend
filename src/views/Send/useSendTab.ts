import { useState } from "react";
import { DateTime } from "luxon";
import { utils } from "ethers";

import { useLocalPendingDeposits } from "hooks/useLocalPendingDeposits";
import { Deposit } from "../Confirmation";

export default function useSendTab() {
  const [showConfirmationScreen, setShow] = useState(false);
  const [deposit, setDeposit] = useState<Deposit>();

  const { addLocalPendingDeposit } = useLocalPendingDeposits();

  const onCloseConfirmationScreen = () => setShow(false);
  const onDepositConfirmed = (deposit: Deposit) => {
    setDeposit(deposit);
    setShow(true);

    // Optimistically add deposit to local storage for instant visibility on the
    // "My Transactions" page. See `src/hooks/useUserDeposits.ts` for details.
    addLocalPendingDeposit({
      depositId: 0,
      depositTime: DateTime.now().toSeconds(),
      status: "pending",
      filled: "0",
      sourceChainId: deposit.fromChain,
      destinationChainId: deposit.toChain,
      assetAddr: deposit.tokenAddress,
      depositorAddr: utils.getAddress(deposit.from),
      amount: deposit.amount.toString(),
      depositTxHash: deposit.txHash,
      fillTxs: [],
      speedUps: [],
      depositRelayerFeePct: deposit.fees.relayerFee.pct.toString(),
      initialRelayerFeePct: deposit.fees.relayerFee.pct.toString(),
      suggestedRelayerFeePct: deposit.fees.relayerFee.pct.toString(),
    });
  };
  return {
    showConfirmationScreen,
    deposit,
    onDepositConfirmed,
    onCloseConfirmationScreen,
  };
}
