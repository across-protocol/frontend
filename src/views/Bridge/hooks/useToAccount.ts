import { useState, useCallback, useMemo } from "react";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useAddressType } from "hooks/useAddressType";

export type ToAccount = {
  address: string;
  isContract: boolean;
  is7702Delegate: boolean;
};

export function useToAccount(toChainId?: number) {
  const [customToAddressEVM, setCustomToAddressEVM] = useState<
    string | undefined
  >();
  const [customToAddressSVM, setCustomToAddressSVM] = useState<
    string | undefined
  >();

  const { account: connectedAccountEVM } = useConnectionEVM();
  const { account: connectedAccountSVM } = useConnectionSVM();

  const connectedRecipientAccountEVM = useAddressType(
    connectedAccountEVM,
    toChainId
  );
  const customRecipientAccountEVM = useAddressType(
    customToAddressEVM,
    toChainId
  );

  const toAccountEVM = useMemo<ToAccount | undefined>(() => {
    if (customRecipientAccountEVM && customToAddressEVM) {
      return {
        address: customToAddressEVM,
        isContract: customRecipientAccountEVM === "contract",
        is7702Delegate: customRecipientAccountEVM === "7702Delegate",
      };
    }
    if (connectedRecipientAccountEVM && connectedAccountEVM) {
      return {
        address: connectedAccountEVM,
        isContract: connectedRecipientAccountEVM === "contract",
        is7702Delegate: connectedRecipientAccountEVM === "7702Delegate",
      };
    }
    return undefined;
  }, [
    customToAddressEVM,
    connectedAccountEVM,
    connectedRecipientAccountEVM,
    customRecipientAccountEVM,
  ]);

  const toAccountSVM = useMemo<ToAccount | undefined>(() => {
    if (customToAddressSVM) {
      return {
        address: customToAddressSVM,
        isContract: false,
        is7702Delegate: false,
      };
    }
    if (connectedAccountSVM) {
      return {
        address: connectedAccountSVM.toBase58(),
        isContract: false,
        is7702Delegate: false,
      };
    }
    return undefined;
  }, [customToAddressSVM, connectedAccountSVM]);

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
