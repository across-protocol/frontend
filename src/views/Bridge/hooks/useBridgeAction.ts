import { useConnection, useERC20 } from "hooks";
import { useAllowance } from "hooks/useAllowance";
import { useMutation } from "react-query";
import {
  AcrossDepositArgs,
  getConfig,
  MAX_APPROVAL_AMOUNT,
  sendAcrossDeposit,
  waitOnTransaction,
} from "utils";

export function useBridgeAction(
  dataLoading: boolean,
  payload?: AcrossDepositArgs,
  tokenSymbol?: string,
  onTransactionComplete?: (hash: string) => void,
  onDepositResolved?: (success: boolean) => void
) {
  const { isConnected, connect, account, chainId, signer, notify } =
    useConnection();
  const { approve } = useERC20(tokenSymbol ?? "");
  const { allowance } = useAllowance(
    tokenSymbol,
    payload?.fromChain,
    account,
    payload ? getConfig().getSpokePoolAddress(payload.fromChain) : undefined
  );

  const approvalHandler = async () => {
    if (allowance !== undefined && payload && signer) {
      const spokePool = getConfig().getSpokePool(payload.fromChain, signer);
      if (chainId === payload.fromChain) {
        if (allowance.lt(payload.amount)) {
          try {
            const tx = await approve({
              spender: spokePool.address,
              amount: MAX_APPROVAL_AMOUNT,
              signer,
            });
            if (tx) {
              await waitOnTransaction(tx, notify);
            }
          } catch (e) {
            console.error(e);
            return;
          }
        }
      }
    }
  };

  const buttonActionHandler = useMutation(async () => {
    if (!isConnected) {
      connect();
    } else {
      if (allowance !== undefined && payload && signer) {
        if (chainId === payload.fromChain) {
          if (allowance.lt(payload.amount)) {
            await approvalHandler();
          }
          try {
            const tx = await sendAcrossDeposit(signer, payload);
            if (onTransactionComplete) {
              onTransactionComplete(tx.hash);
            }
            await waitOnTransaction(tx, notify);
            if (onDepositResolved) {
              onDepositResolved(true);
            }
          } catch (e) {
            console.error(e);
            if (onDepositResolved) {
              onDepositResolved(false);
            }
            return;
          }
        }
      }
    }
  });

  let buttonLabel = "";
  if (!isConnected) {
    buttonLabel = "Connect wallet";
  } else if (payload) {
    if (dataLoading || !allowance) {
      buttonLabel = "Loading...";
    } else {
      if (buttonActionHandler.isLoading) {
        buttonLabel = "Confirming...";
      } else {
        buttonLabel = "Confirm transaction";
      }
    }
  } else {
    buttonLabel = "Confirm transaction";
  }
  const buttonDisabled =
    !payload || (isConnected && dataLoading) || buttonActionHandler.isLoading;

  return {
    isConnected,
    buttonActionHandler: buttonActionHandler.mutateAsync,
    isButtonActionLoading: buttonActionHandler.isLoading,
    buttonLabel,
    buttonDisabled,
  };
}
