import { BigNumber } from "ethers";
import { useConnection, useERC20 } from "hooks";
import { useAllowance } from "hooks/useAllowance";
import { useMutation } from "react-query";
import { getConfig, MAX_APPROVAL_AMOUNT } from "utils";

export function useBridgeAction(
  dataLoading: boolean,
  amountToBridge?: BigNumber,
  token?: string,
  fromRoute?: number,
  toRoute?: number
) {
  const { isConnected, connect, account, chainId, signer } = useConnection();
  const { approve } = useERC20(token ?? "");
  const { allowance } = useAllowance(
    token,
    fromRoute,
    account,
    fromRoute ? getConfig().getSpokePoolAddress(fromRoute) : undefined
  );
  const buttonActionHandler = useMutation(async () => {
    // Connect wallet if not connected
    if (!isConnected) {
      connect();
    } else {
      // Check if allowance is defined, if the user amount to bridge, and if the token, fromRoute and toRoute are defined
      if (
        allowance !== undefined &&
        amountToBridge !== undefined &&
        token &&
        fromRoute &&
        toRoute
      ) {
        // Get the spoke pool address and chain id
        const spokePool = getConfig().getSpokePool(fromRoute, signer);
        // Ensure that the chain id is the same as the current chain id
        if (chainId === fromRoute) {
          // Check if allowance is insufficient
          if (allowance.lt(amountToBridge)) {
            // If not, call the approve function
            await approve({
              spender: spokePool.address,
              amount: MAX_APPROVAL_AMOUNT,
              signer,
            });
          }
          // else If not, call the approve function only if the token, fromRoute and toRoute are defined
          else {
            // await
          }
        }
      }
    }
  });

  let buttonLabel = "";
  if (!isConnected) {
    buttonLabel = "Connect wallet";
  } else if (amountToBridge) {
    if (dataLoading || !allowance) {
      buttonLabel = "Loading...";
    } else if (allowance.lt(amountToBridge)) {
      buttonLabel = "Approve";
    } else {
      buttonLabel = "Confirm transaction";
    }
  } else {
    buttonLabel = "Confirm transaction";
  }
  const buttonDisabled = !amountToBridge || (isConnected && dataLoading);

  return {
    isConnected,
    buttonActionHandler,
    buttonLabel,
    buttonDisabled,
  };
}
