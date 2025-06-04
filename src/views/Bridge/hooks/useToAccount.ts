import { useState, useEffect } from "react";

import { useConnection } from "hooks";
import { getCode } from "utils";
import {
  useIsContractAddress,
  is7702Delegate,
} from "hooks/useIsContractAddress";

export type ToAccount = {
  address: string;
  isContract: boolean;
};

export function useToAccount(toChainId?: number) {
  const [customToAddress, setCustomToAddress] = useState<string | undefined>();
  const [toAccount, setToAccount] = useState<ToAccount | undefined>();

  const { account: connectedAccount } = useConnection();
  const isConnectedAccountContract = useIsContractAddress(
    connectedAccount,
    toChainId
  );

  useEffect(() => {
    if (!toChainId) {
      return;
    }

    if (customToAddress) {
      getCode(customToAddress, toChainId)
        .then((code) =>
          setToAccount({
            address: customToAddress,
            isContract: code !== "0x" || !is7702Delegate(code),
          })
        )
        .catch((error) => {
          console.error("Failed to get code", error);
          setToAccount({
            address: customToAddress,
            isContract: false,
          });
        });
    } else if (connectedAccount) {
      setToAccount({
        address: connectedAccount,
        isContract: isConnectedAccountContract,
      });
    } else {
      setToAccount(undefined);
    }
  }, [
    customToAddress,
    connectedAccount,
    isConnectedAccountContract,
    toChainId,
  ]);

  return {
    toAccount,
    setCustomToAddress,
  };
}
