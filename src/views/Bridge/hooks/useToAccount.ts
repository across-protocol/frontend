import { useState, useEffect, useCallback } from "react";

import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { getCode, getEcosystem } from "utils";

export type ToAccount = {
  address: string;
  isContract: boolean;
};

export function useToAccount(toChainId?: number) {
  const [customToAddressEVM, setCustomToAddressEVM] = useState<
    string | undefined
  >();
  const [customToAddressSVM, setCustomToAddressSVM] = useState<
    string | undefined
  >();

  const [toAccountEVM, setToAccountEVM] = useState<ToAccount | undefined>();
  const [toAccountSVM, setToAccountSVM] = useState<ToAccount | undefined>();

  const {
    account: connectedAccountEVM,
    isContractAddress: isConnectedAccountContractEVM,
  } = useConnectionEVM();
  const { account: connectedAccountSVM } = useConnectionSVM();

  const ecosystem = toChainId ? getEcosystem(toChainId) : "evm";

  // Handle EVM recipient address changes
  useEffect(() => {
    if (!toChainId || ecosystem === "svm") {
      return;
    }

    if (customToAddressEVM) {
      getCode(customToAddressEVM, toChainId)
        .then((code) =>
          setToAccountEVM({
            address: customToAddressEVM,
            isContract: code !== "0x",
          })
        )
        .catch((error) => {
          console.error(error);
        });
      setToAccountEVM({
        address: customToAddressEVM,
        isContract: false,
      });
    } else if (connectedAccountEVM) {
      setToAccountEVM({
        address: connectedAccountEVM,
        isContract: isConnectedAccountContractEVM,
      });
    } else {
      setToAccountEVM(undefined);
    }
  }, [
    customToAddressEVM,
    connectedAccountEVM,
    isConnectedAccountContractEVM,
    toChainId,
    ecosystem,
  ]);

  // Handle SVM recipient address changes
  useEffect(() => {
    if (!toChainId || ecosystem === "evm") {
      return;
    }

    if (customToAddressSVM) {
      setToAccountSVM({
        address: customToAddressSVM,
        isContract: false,
      });
    } else if (connectedAccountSVM) {
      setToAccountSVM({
        address: connectedAccountSVM.toBase58(),
        isContract: false,
      });
    } else {
      setToAccountSVM(undefined);
    }
  }, [toChainId, ecosystem, customToAddressSVM, connectedAccountSVM]);

  const handleChangeToAddressEVM = useCallback((address: string) => {
    setCustomToAddressEVM(address);
  }, []);

  const handleChangeToAddressSVM = useCallback((address: string) => {
    setCustomToAddressSVM(address);
  }, []);

  return {
    toAccountEVM,
    toAccountSVM,
    handleChangeToAddressEVM,
    handleChangeToAddressSVM,
  };
}
