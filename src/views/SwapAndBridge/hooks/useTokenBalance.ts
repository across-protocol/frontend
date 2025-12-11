import { BigNumber } from "ethers";
import { useUserTokenBalances } from "hooks/useUserTokenBalances";
import { useMemo } from "react";
import { compareAddressesSimple } from "utils";
import { EnrichedToken } from "../components/ChainTokenSelector/ChainTokenSelectorModal";

// todo: implement local rpc fallback
export function useTokenBalance(
  token?: Pick<EnrichedToken, "address" | "chainId"> | null | undefined
) {
  const { data: userBalances } = useUserTokenBalances();

  return useMemo(() => {
    return token
      ? BigNumber.from(
          userBalances?.balances
            ?.find((c) => Number(c.chainId) === token.chainId)
            ?.balances.find((b) =>
              compareAddressesSimple(b.address, token.address)
            )?.balance ?? 0
        )
      : undefined;
  }, [token, userBalances?.balances]);
}
