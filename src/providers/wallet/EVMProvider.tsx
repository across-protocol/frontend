import { type PropsWithChildren } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "wagmi.config";

export function EVMProvider({ children }: PropsWithChildren) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
}
