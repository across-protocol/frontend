import { useState, useMemo } from "react";
import { useConnection } from "hooks";
import { useAddressType } from "hooks/useIsContractAddress";

export type ToAccount = {
  address: string;
  isContract: boolean;
  is7702Delegate: boolean;
};

export function useToAccount(toChainId?: number) {
  const [customToAddress, setCustomToAddress] = useState<string | undefined>();

  const { account: connectedAccount } = useConnection();
  const connectedRecipientAccount = useAddressType(connectedAccount, toChainId);
  const customRecipientAccount = useAddressType(customToAddress, toChainId);

  const toAccount = useMemo<ToAccount | undefined>(() => {
    if (customToAddress) {
      return {
        address: customToAddress,
        isContract: customRecipientAccount === "contract",
        is7702Delegate: customRecipientAccount === "7702Delegate",
      };
    }
    if (connectedAccount) {
      return {
        address: connectedAccount,
        isContract: connectedRecipientAccount === "contract",
        is7702Delegate: connectedRecipientAccount === "7702Delegate",
      };
    }
    return undefined;
  }, [
    connectedAccount,
    connectedRecipientAccount,
    customRecipientAccount,
    customToAddress,
  ]);

  return {
    toAccount,
    setCustomToAddress,
  };
}
