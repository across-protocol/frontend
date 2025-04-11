import { type PropsWithChildren } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

import { ChainId, hubPoolChainId } from "utils";

const network =
  hubPoolChainId === ChainId.MAINNET
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [
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
