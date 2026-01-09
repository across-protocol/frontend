import { type PropsWithChildren, useEffect } from "react";
import { useAccount } from "wagmi";
import { setUserContext, setChainContext } from "utils/sentry";

export function SentryProvider({ children }: PropsWithChildren) {
  const { address, chainId } = useAccount();

  useEffect(() => {
    setUserContext(address ?? null);
  }, [address]);

  useEffect(() => {
    setChainContext(chainId);
  }, [chainId]);

  return <>{children}</>;
}
