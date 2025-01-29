import { http, createConfig, Transport } from "wagmi";
import {
  injected,
  metaMask,
  safe,
  walletConnect,
  coinbaseWallet,
} from "wagmi/connectors";

import { chains_viem } from "constants/chains/configs";
import { walletConnectProjectId } from "utils/constants";

const dappMetadata = {
  name: "Across Bridge",
  url: "https://app.across.to",
  iconUrl: "https://app.across.to/logo-small.png",
};

export const wagmiConfig = createConfig({
  chains: chains_viem,
  transports: chains_viem.reduce(
    (acc, chain) => {
      acc[chain.id] = http(chain.rpcUrls.default.http[0]);
      return acc;
    },
    {} as Record<number, Transport>
  ),
  connectors: [
    injected(),
    coinbaseWallet({
      appName: dappMetadata.name,
      appLogoUrl: dappMetadata.iconUrl,
    }),
    walletConnect({ projectId: walletConnectProjectId }),
    safe(),
    metaMask({
      dappMetadata,
    }),
  ],
});
