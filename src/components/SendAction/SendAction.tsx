import React from "react";
import {
  useBridgeFees,
  useConnection,
  useDeposits,
  useSend,
  useTransactions,
} from "state/hooks";
import { TransactionTypes } from "state/transactions";
import { useERC20 } from "hooks";
import { CHAINS, getDepositBox, TOKENS_LIST, formatUnits } from "utils";
import { PrimaryButton, AccentSection } from "components";
import { Wrapper, Info } from "./SendAction.styles";

const SendAction: React.FC = () => {
  const { amount, fromChain, toChain, token, send, hasToApprove, canSend } =
    useSend();
  const { addTransaction } = useTransactions();
  const { addDeposit } = useDeposits();
  const { approve } = useERC20(token);
  const { signer } = useConnection();
  const tokenInfo = TOKENS_LIST[fromChain].find((t) => t.address === token);
  const { data: fees } = useBridgeFees({
    tokenSymbol: tokenInfo!.symbol,
    amount,
  });
  const depositBox = getDepositBox(fromChain);
  const handleApprove = async () => {
    const tx = await approve({ amount, spender: depositBox.address, signer });
    if (tx) {
      addTransaction({ ...tx, meta: { label: TransactionTypes.APPROVE } });
    }
  };
  const handleSend = async () => {
    const tx = await send();
    if (tx) {
      addTransaction({ ...tx, meta: { label: TransactionTypes.DEPOSIT } });
      const receipt = await tx.wait();
      addDeposit({ deposit: receipt });
    }
  };
  const handleClick = () => {
    if (amount.lte(0) || !signer) {
      return;
    }
    if (hasToApprove) {
      handleApprove();
      return;
    }
    if (canSend) {
      handleSend();
    }
  };

  const buttonMsg = hasToApprove ? "Approve" : "Send";

  console.log({
    instant: fees?.instantRelayFee?.total?.toString(),
    slow: fees?.slowRelayFee?.total?.toString(),
    lpFee: fees?.lpFee?.total?.toString(),
  });
  const amountMinusFees =
    fees && amount.gte(0)
      ? amount.sub(fees.instantRelayFee.total).sub(fees.slowRelayFee.total)
      : amount;

  return (
    <AccentSection>
      <Wrapper>
        {fees && tokenInfo && (
          <>
            <Info>
              <div>Time to {CHAINS[toChain].name}</div>
              <div>~1-3 minutes</div>
            </Info>
            <Info>
              <div>Bridge Fee</div>
              <div>
                {formatUnits(fees.instantRelayFee.total, tokenInfo.decimals)}{" "}
                {tokenInfo.symbol}
              </div>
            </Info>
            <Info>
              <div>You will get</div>
              <div>
                {formatUnits(amountMinusFees, tokenInfo.decimals)}{" "}
                {tokenInfo.symbol}
              </div>
            </Info>
          </>
        )}
        <PrimaryButton
          onClick={handleClick}
          disabled={!canSend || amountMinusFees.lte(0)}
        >
          {buttonMsg}
        </PrimaryButton>
      </Wrapper>
    </AccentSection>
  );
};

export default SendAction;
