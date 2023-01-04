import { useConnection, useERC20 } from "hooks";
import { useAllowance } from "hooks/useAllowance";
import { useMutation } from "react-query";
import {
  AcrossDepositArgs,
  getConfig,
  MAX_APPROVAL_AMOUNT,
  notificationEmitter,
  sendAcrossDeposit,
} from "utils";

export function useBridgeAction(
  dataLoading: boolean,
  payload?: AcrossDepositArgs,
  tokenSymbol?: string
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
  const buttonActionHandler = useMutation(async () => {
    // Connect wallet if not connected
    if (!isConnected) {
      connect();
    } else {
      // Check if allowance is defined, payload is defined and signer is defined
      if (allowance !== undefined && payload && signer) {
        // Get the spoke pool address and chain id
        const spokePool = getConfig().getSpokePool(payload.fromChain, signer);
        // Ensure that the chain id is the same as the current chain id
        if (chainId === payload.fromChain) {
          // Check if allowance is insufficient
          if (allowance.lt(payload.amount)) {
            // If not, call the approve function
            const tx = await approve({
              spender: spokePool.address,
              amount: MAX_APPROVAL_AMOUNT,
              signer,
            });
            if (tx) {
              await notificationEmitter(tx.hash, notify);
            }
          } else {
            // If so, call the sendAcrossDeposit function
            const tx = await sendAcrossDeposit(signer, payload);
            await notificationEmitter(tx.hash, notify);
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
    } else if (allowance.lt(payload.amount)) {
      if (buttonActionHandler.isLoading) {
        buttonLabel = "Approving...";
      } else {
        buttonLabel = "Approve";
      }
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
