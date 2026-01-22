import { BigNumber } from "ethers";
import { useUserTokenBalances } from "hooks/useUserTokenBalances";
import { useMemo } from "react";
import {
  chainIsSvm,
  compareAddressesSimple,
  getTokenBalance,
  isDefined,
} from "utils";
import { EnrichedToken } from "../components/ChainTokenSelector/ChainTokenSelectorModal";
import { useQuery } from "@tanstack/react-query";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";

// returns the connected wallet's balance for particular token
export function useTokenBalance(
  token?: Pick<EnrichedToken, "address" | "chainId"> | null | undefined
) {
  const { data: userBalances } = useUserTokenBalances();
  const { data: localBalance } = useTokenBalanceLocal(token);

  return useMemo(() => {
    if (!token) return BigNumber.from(0);

    // Try local first (we update more often)
    if (localBalance !== undefined && localBalance !== null) {
      return BigNumber.from(localBalance);
    }

    // Fall back to API balance
    const balanceFromUserBalances = userBalances?.balances
      ?.find((c) => Number(c.chainId) === token.chainId)
      ?.balances.find((b) =>
        compareAddressesSimple(b.address, token.address)
      )?.balance;

    if (
      balanceFromUserBalances !== undefined &&
      balanceFromUserBalances !== null
    ) {
      return BigNumber.from(balanceFromUserBalances);
    }

    return BigNumber.from(0);
  }, [token, localBalance, userBalances?.balances]);
}

export function useTokenBalanceLocal(
  token?: Pick<EnrichedToken, "address" | "chainId"> | null | undefined
) {
  const { account: evmAccount } = useConnectionEVM();
  const { account: svmAccount } = useConnectionSVM();

  const svmAccountString = svmAccount?.toString();

  return useQuery({
    queryKey: ["tokenBalanceLocal", token, svmAccountString, evmAccount],
    queryFn: async () => {
      if (!token) return;
      const wallet = chainIsSvm(token.chainId) ? svmAccountString : evmAccount;
      if (!wallet) return;
      return await getTokenBalance(token?.chainId, wallet, token.address);
    },
    enabled:
      (isDefined(evmAccount) || isDefined(svmAccountString)) &&
      isDefined(token),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}
