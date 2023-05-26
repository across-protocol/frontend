import { useState, useEffect } from "react";

import { useConnection } from "hooks";
import { getCode } from "utils";

export type ToAccount = {
  address: string;
  isContract: boolean;
};

export function useToAccount(toChainId?: number) {
  const [customToAddress, setCustomToAddress] = useState<string | undefined>();
  const [toAccount, setToAccount] = useState<ToAccount | undefined>();

  const {
    account: connectedAccount,
    isContractAddress: isConnectedAccountContract,
  } = useConnection();

  useEffect(() => {
    if (!toChainId) {
      return;
    }

    if (customToAddress) {
      getCode(customToAddress, toChainId)
        .then((code) =>
          setToAccount({
            address: customToAddress,
            isContract: code !== "0x",
          })
        )
        .catch((error) => {
          console.error(error);
        });
      setToAccount({
        address: customToAddress,
        isContract: false,
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
