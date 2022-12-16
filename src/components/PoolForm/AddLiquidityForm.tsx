import { FC, useState, useCallback, useEffect } from "react";
import { useConnection } from "hooks";
import {
  RoundBox,
  MaxButton,
  Input,
  FormButton,
  InputGroup,
  FormHeader,
  Balance,
  LiquidityErrorBox,
} from "./AddLiquidityForm.styles";
import { getPoolClient } from "state/poolsApi";
import { toWeiSafe } from "utils/weiMath";
import { useERC20 } from "hooks";
import { ethers } from "ethers";
import { addEtherscan } from "utils/notify";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import {
  getChainInfo,
  switchChain,
  disableDeposits,
  ChainId,
  trackConnectWalletButtonClicked,
} from "utils";
import api from "state/chainApi";
import type { ShowSuccess } from "views/Pool";
import { useError } from "hooks";

// max uint value is 2^256 - 1
const MAX_UINT_VAL = ethers.constants.MaxUint256;
const INFINITE_APPROVAL_AMOUNT = MAX_UINT_VAL;

interface Props {
  error: Error | undefined;
  amount: string;
  onChange: (value: string) => void;
  hubPoolAddress: string;
  decimals: number;
  symbol: string;
  tokenAddress: string;
  setShowSuccess: React.Dispatch<React.SetStateAction<ShowSuccess | undefined>>;
  setDepositUrl: React.Dispatch<React.SetStateAction<string>>;
  balance: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  wrongNetwork?: boolean | null;
  formError: string;
  // refetch balance
  refetchBalance: () => void;
  onMaxClick: () => void;
  chainId: ChainId;
  refetchPool: () => void;
}

const AddLiquidityForm: FC<Props> = ({
  error,
  amount,
  onChange,
  hubPoolAddress,
  decimals,
  symbol,
  tokenAddress,
  setShowSuccess,
  setDepositUrl,
  balance,
  wrongNetwork,
  formError,
  onMaxClick,
  chainId,
  refetchBalance,
  refetchPool,
}) => {
  const poolClient = getPoolClient();
  const { addError } = useError();

  const { isConnected, provider, signer, notify, account, connect } =
    useConnection();
  const { approve, allowance: getAllowance } = useERC20(tokenAddress);

  const [allowance, setAllowance] = useState("0");
  const [userNeedsToApprove, setUserNeedsToApprove] = useState(false);
  const [txSubmitted, setTxSubmitted] = useState(false);
  const [updateEthBalance] = api.endpoints.ethBalance.useLazyQuery();
  const chainName = getChainInfo(chainId).name;

  const updateAllowance = useCallback(async () => {
    if (!account || !provider || symbol === "ETH") return;
    const allowance = await getAllowance({
      account,
      spender: hubPoolAddress,
      provider,
    });
    setAllowance(allowance.toString());
  }, [setAllowance, getAllowance, provider, account, hubPoolAddress, symbol]);

  // trigger update allowance, only if bridge/token changes. ignore eth.
  useEffect(() => {
    if (isConnected && symbol !== "ETH" && !wrongNetwork) updateAllowance();
  }, [isConnected, symbol, updateAllowance, wrongNetwork]);

  // check if user needs to approve based on amount entered in form or a change in allowance
  useEffect(() => {
    try {
      if (symbol === "ETH") {
        setUserNeedsToApprove(false);
      } else {
        const weiAmount = toWeiSafe(amount, decimals);
        const hasToApprove = weiAmount.gt(allowance);
        setUserNeedsToApprove(hasToApprove);
      }
    } catch (err) {
      // do nothing. this happens when users input is not a number and causes toWei to throw. if we dont
      // catch here, app will crash when user enters something like "0."
    }
  }, [amount, allowance, symbol, decimals]);

  const handleApprove = async () => {
    try {
      const tx = await approve({
        amount: INFINITE_APPROVAL_AMOUNT,
        spender: hubPoolAddress,
        signer,
      });

      if (tx) {
        setTxSubmitted(true);
        const { emitter } = notify.hash(tx.hash);
        emitter.on("all", addEtherscan);

        emitter.on("txConfirmed", () => {
          notify.unsubscribe(tx.hash);
          if (account) {
            setTimeout(() => {
              // these need to be delayed, because our providers need time to catch up with notifyjs.
              // If we don't wait then these calls will fail to update correctly, leaving the user to have to refresh.
              setTxSubmitted(false);
              updateAllowance().catch((err) =>
                console.error("Error checking approval:", err)
              );
              updateEthBalance({ chainId: 1, account });
            }, 15000);
          }
        });

        emitter.on("txFailed", () => {
          notify.unsubscribe(tx.hash);
          setTxSubmitted(false);
        });
      }
    } catch (err: any) {
      addError(new Error(`Error in approve call: ${err.message}`));
      console.error(err);
    }
  };

  const approveOrPoolTransactionHandler = async () => {
    if (!provider) {
      connect();
      trackConnectWalletButtonClicked("addLiquidityForm");
    }
    if (disableDeposits) return false;
    if (isConnected && userNeedsToApprove) return handleApprove();

    if (isConnected && Number(amount) > 0 && signer) {
      const weiAmount = toWeiSafe(amount, decimals);

      try {
        let txId;
        if (symbol === "ETH") {
          txId = await poolClient.addEthLiquidity(signer, weiAmount);
        } else {
          txId = await poolClient.addTokenLiquidity(
            signer,
            tokenAddress,
            weiAmount
          );
        }

        const transaction = poolClient.getTxState(txId);

        if (transaction.hash) {
          setTxSubmitted(true);
          const { emitter } = notify.hash(transaction.hash);
          emitter.on("all", addEtherscan);
          emitter.on("txConfirmed", (tx) => {
            if (transaction.hash) notify.unsubscribe(transaction.hash);
            setShowSuccess("deposit");
            setTxSubmitted(false);
            const url = `https://etherscan.io/tx/${transaction.hash}`;
            setDepositUrl(url);
            refetchPool();
            if (account)
              setTimeout(
                () => updateEthBalance({ chainId: 1, account }),
                15000
              );
          });
          emitter.on("txFailed", () => {
            if (transaction.hash) notify.unsubscribe(transaction.hash);
            setTxSubmitted(false);
          });
        }

        return transaction;
      } catch (err: any) {
        addError(new Error(`Error in add liquidity call: ${err.message}`));

        console.error("err in AddEthLiquidity call", err);
      }
    }
  };

  function buttonMessage() {
    if (!isConnected) return "Connect wallet";
    if (userNeedsToApprove) return "Approve";
    return "Add Liquidity";
  }

  return (
    <>
      <FormHeader>Amount</FormHeader>

      <InputGroup>
        <RoundBox
          as="label"
          htmlFor="amount"
          style={{
            // @ts-expect-error TS does not likes custom CSS vars
            "--color": error
              ? "var(--color-error-light)"
              : "var(--color-white)",
            "--outline-color": error
              ? "var(--color-error)"
              : "var(--color-primary)",
          }}
        >
          <MaxButton onClick={onMaxClick} disabled={!isConnected}>
            max
          </MaxButton>
          <Input
            data-cy="add-liquidty-input"
            placeholder="0.00"
            id="amount"
            value={amount}
            onChange={(e) => onChange(e.target.value)}
            disabled={!isConnected}
          />
        </RoundBox>
      </InputGroup>
      {isConnected && (
        <Balance>
          <span>
            Balance: {ethers.utils.formatUnits(balance, decimals)} {symbol}
          </span>
        </Balance>
      )}
      {formError && <LiquidityErrorBox>{formError}</LiquidityErrorBox>}
      {wrongNetwork && provider ? (
        <FormButton onClick={() => switchChain(provider, chainId)}>
          Switch to {chainName}
        </FormButton>
      ) : (
        <FormButton
          disabled={
            ((provider && !!disableDeposits) ||
              !provider ||
              !!formError ||
              Number(amount) <= 0) &&
            isConnected
          }
          onClick={() => {
            return approveOrPoolTransactionHandler().catch((err) =>
              console.error("Error on click to approve or pool tx", err)
            );
          }}
          data-cy="add-liquidity-button"
        >
          {buttonMessage()}
          {txSubmitted ? <BouncingDotsLoader dataCy="bouncing-loader" /> : null}
        </FormButton>
      )}
    </>
  );
};

export default AddLiquidityForm;
