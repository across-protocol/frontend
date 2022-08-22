import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers } from "ethers";
import {
  onboardApiKey,
  hubPoolChainId,
  ChainId,
  providerUrlsTable,
  trackEvent,
  debug,
} from "utils";

const injected = injectedModule();

const onboard = Onboard({
  apiKey: onboardApiKey,
  wallets: [injected],
  /* 
  export interface Chain {
    namespace?: 'evm';
    id: ChainId;
    rpcUrl: string;
    label: string;
    token: TokenSymbol;
    color?: string;
    icon?: string;
    providerConnectionInfo?: ConnectionInfo;
    publicRpcUrl?: string;
    blockExplorerUrl?: string;
}
  */
  chains: [
    {
      id: 1,
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: providerUrlsTable[ChainId.MAINNET],
    },
    {
      id: 10,
      token: "OP",
      label: "Optimism Mainnet",
      rpcUrl: providerUrlsTable[ChainId.OPTIMISM],
    },
    {
      id: 137,
      token: "MATIC",
      label: "Polygon Mainnet",
      rpcUrl: providerUrlsTable[ChainId.POLYGON],
    },
    {
      id: 288,
      token: "BOBA",
      label: "BOBA Mainnet",
      rpcUrl: providerUrlsTable[ChainId.BOBA],
    },
    {
      id: 42161,
      token: "ETH",
      label: "Arbitrum Mainnet",
      rpcUrl: providerUrlsTable[ChainId.ARBITRUM],
    },
  ],
});

const wallets = await onboard.connectWallet();

console.log(wallets);

if (wallets[0]) {
  // create an ethers provider with the last connected wallet provider
  const ethersProvider = new ethers.providers.Web3Provider(
    wallets[0].provider,
    "any"
  );

  const signer = ethersProvider.getSigner();

  // send a transaction with the ethers provider
  const txn = await signer.sendTransaction({
    to: "0x",
    value: 100000000000000,
  });

  const receipt = await txn.wait();
  console.log(receipt);
}
