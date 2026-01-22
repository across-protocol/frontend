import { useConnectionEVM } from "./useConnectionEVM";
import { useConnectionSVM } from "./useConnectionSVM";
import { getEcosystemFromToken } from "../utils";
import type { ChainEcosystem } from "../constants/chains/types";
import type { EnrichedToken } from "../views/SwapAndBridge/components/ChainTokenSelector/ChainTokenSelectorModal";
import type { QuoteAccount } from "../views/SwapAndBridge/hooks/useQuoteRequest/quoteRequestAction";

export const PLACEHOLDER_EVM_ADDRESS =
  "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
export const PLACEHOLDER_SVM_ADDRESS =
  "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t";

type UseEcosystemAccountsParams = {
  originToken: EnrichedToken | null;
  destinationToken: EnrichedToken | null;
  customDestinationAccount?: QuoteAccount | null;
};

type UseEcosystemAccountsReturn = {
  depositor: string | undefined;
  depositorOrPlaceholder: string;
  recipient: string | undefined;
  recipientOrPlaceholder: string;
  originEcosystem: ChainEcosystem;
  destinationEcosystem: ChainEcosystem;
};

export function useEcosystemAccounts({
  originToken,
  destinationToken,
  customDestinationAccount,
}: UseEcosystemAccountsParams): UseEcosystemAccountsReturn {
  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();

  const originEcosystem = getEcosystemFromToken(originToken);
  const destinationEcosystem = getEcosystemFromToken(destinationToken);

  const depositor =
    originEcosystem === "evm" ? accountEVM : accountSVM?.toBase58();
  const depositorOrPlaceholder =
    depositor ||
    (originEcosystem === "evm"
      ? PLACEHOLDER_EVM_ADDRESS
      : PLACEHOLDER_SVM_ADDRESS);

  const defaultRecipient =
    destinationEcosystem === "evm" ? accountEVM : accountSVM?.toBase58();

  const recipient = customDestinationAccount?.address || defaultRecipient;
  const recipientOrPlaceholder =
    recipient ||
    (destinationEcosystem === "evm"
      ? PLACEHOLDER_EVM_ADDRESS
      : PLACEHOLDER_SVM_ADDRESS);

  return {
    depositor,
    depositorOrPlaceholder,
    recipient,
    recipientOrPlaceholder,
    originEcosystem,
    destinationEcosystem,
  };
}
