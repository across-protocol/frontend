import { useQuery } from "@tanstack/react-query";
import { useConnectionEVM } from "hooks/useConnectionEVM";

interface PolymarketProfile {
  proxyWallet?: string;
}

async function fetchPolymarketProfile(
  address: string
): Promise<PolymarketProfile | null> {
  const response = await fetch(`/api/polymarket-profile?address=${address}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch Polymarket profile: ${response.status}`);
  }

  return response.json();
}

export function useHasPolymarketAccount() {
  const { account } = useConnectionEVM();

  const { data, isLoading } = useQuery({
    queryKey: ["polymarket-profile", account],
    queryFn: () => fetchPolymarketProfile(account!),
    enabled: Boolean(account),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  return {
    hasAccount: Boolean(data?.proxyWallet),
    proxyWallet: data?.proxyWallet ?? null,
    isLoading,
  };
}
