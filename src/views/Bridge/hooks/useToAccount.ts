import { useState, useCallback, useMemo } from "react";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useAddressType } from "hooks/useAddressType";
import { chainIsEvm, chainIsSvm } from "utils";

export type ToAccount = {
  address: string;
  isContract: boolean;
  is7702Delegate: boolean;
};

export type ToAccountManagement = ReturnType<typeof useToAccount>;

export function useToAccount(toChainId?: number) {
  const [customToAddressEVM, setCustomToAddressEVM] = useState<
    string | undefined
  >();
  const [customToAddressSVM, setCustomToAddressSVM] = useState<
    string | undefined
  >();

  const { account: connectedAccountEVM } = useConnectionEVM();
  const { account: connectedAccountSVM } = useConnectionSVM();

  const isDestinationEVM = Boolean(toChainId && chainIsEvm(toChainId));
  const isDestinationSVM = Boolean(toChainId && chainIsSvm(toChainId));

  // For EVM addresses, only validate if destination is EVM
  const connectedRecipientAccountEVM = useAddressType(
    connectedAccountEVM,
    toChainId,
    {
      enabled: isDestinationEVM,
    }
  );
  const customRecipientAccountEVM = useAddressType(
    customToAddressEVM,
    toChainId,
    {
      enabled: isDestinationEVM,
    }
  );

  // For SVM addresses, only validate if destination is SVM
  const connectedRecipientAccountSVM = useAddressType(
    connectedAccountSVM?.toBase58(),
    toChainId,
    {
      enabled: isDestinationSVM,
    }
  );
  const customRecipientAccountSVM = useAddressType(
    customToAddressSVM,
    toChainId,
    {
      enabled: isDestinationSVM,
    }
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
    if (customRecipientAccountSVM && customToAddressSVM) {
      return {
        address: customToAddressSVM,
        isContract: customRecipientAccountSVM === "contract",
        is7702Delegate: false, // SVM doesn't have 7702 delegates
      };
    }
    if (connectedRecipientAccountSVM && connectedAccountSVM) {
      return {
        address: connectedAccountSVM.toBase58(),
        isContract: connectedRecipientAccountSVM === "contract",
        is7702Delegate: false, // SVM doesn't have 7702 delegates
      };
    }
    return undefined;
  }, [
    customToAddressSVM,
    connectedAccountSVM,
    connectedRecipientAccountSVM,
    customRecipientAccountSVM,
  ]);

  const handleChangeToAddressEVM = useCallback((address: string) => {
    setCustomToAddressEVM(address);
  }, []);

  const handleChangeToAddressSVM = useCallback((address: string) => {
    setCustomToAddressSVM(address);
  }, []);

  const defaultRecipientAccount = useMemo(() => {
    return isDestinationSVM
      ? connectedAccountSVM?.toBase58()
      : connectedAccountEVM;
  }, [connectedAccountEVM, connectedAccountSVM, isDestinationSVM]);

  const currentRecipientAccount = useMemo(() => {
    return isDestinationSVM ? toAccountSVM?.address : toAccountEVM?.address;
  }, [isDestinationSVM, toAccountEVM?.address, toAccountSVM?.address]);

  return {
    currentRecipientAccount,
    defaultRecipientAccount,
    toAccountEVM,
    toAccountSVM,
    handleChangeToAddressEVM,
    handleChangeToAddressSVM,
  };
}
