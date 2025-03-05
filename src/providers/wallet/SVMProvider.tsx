import { type PropsWithChildren } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  WalletConnectWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

import { ChainId, hubPoolChainId } from "utils";

const network =
  hubPoolChainId === ChainId.MAINNET
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [
  new UnsafeBurnerWalletAdapter(),
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new LedgerWalletAdapter(),
  new WalletConnectWalletAdapter({
    network,
    options: {
      metadata: {
        name: "Across Bridge",
        description: "Across Protocol",
        url: "https://app.across.to",
        icons: ["https://app.across.to/logo-small.png"],
      },
    },
  }),
];

export function SVMProvider({ children }: PropsWithChildren) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
