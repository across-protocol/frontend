import assert from "assert";
import { ethers } from "ethers";
import { getConfig } from "utils";
import { ChainInfoList, ChainInfoTable, ChainId, ChainInfo } from "./utils.d";
import ethereumLogo from "assets/ethereum-logo.svg";
import optimismLogo from "assets/optimism-alt-logo.svg";
import arbitrumLogo from "assets/arbitrum-logo.svg";
import bobaLogo from "assets/boba-logo.svg";
import polygonLogo from "assets/polygon-logo.svg";
import { isSupportedChainId } from "./constants";
export async function switchChain(
  provider: ethers.providers.Web3Provider,
  chainId: ChainId
) {
  const config = getConfig();
  const chainInfo = getChainInfo(chainId);
  try {
    await provider.send("wallet_switchEthereumChain", [
      {
        chainId: ethers.utils.hexValue(chainId),
      },
    ]);
  } catch (switchError: any) {
    // 4902 = Unrecognized chain ID -32603 = Internal JSON-RPC error
    if (switchError.code === 4902 || switchError.code === -32603) {
      try {
        const { name, symbol, decimals } = config.getNativeTokenInfo(chainId);
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: ethers.utils.hexValue(chainId),
            chainName: chainInfo.fullName ?? chainInfo.name,
            rpcUrls: [chainInfo.rpcUrl],
            blockExplorerUrls: [chainInfo.explorerUrl],
            nativeCurrency: { name, symbol, decimals },
          },
        ]);
      } catch (addError) {
        console.error(
          `Failed to add ${chainInfo.fullName ?? chainInfo.name}`,
          addError
        );
      }
    } else {
      console.error(
        `Failed to switch to ${chainInfo.fullName ?? chainInfo.name}`,
        switchError
      );
    }
  }
}

export const defaultBlockPollingInterval =
  Number(process.env.REACT_APP_DEFAULT_BLOCK_POLLING_INTERVAL_S || 30) * 1000;

const defaultConstructExplorerLink =
  (explorerUrl: string) => (txHash: string) =>
    `${explorerUrl}/tx/${txHash}`;

export const chainInfoList: ChainInfoList = [
  {
    name: "Ethereum",
    fullName: "Ethereum Mainnet",
    chainId: ChainId.MAINNET,
    logoURI: ethereumLogo,
    explorerUrl: "https://etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink("https://etherscan.io"),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 14704425,
  },
  {
    name: "Arbitrum",
    fullName: "Arbitrum One",
    chainId: ChainId.ARBITRUM,
    logoURI: arbitrumLogo,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://arbiscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "AETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 11102271,
  },
  {
    name: "Boba",
    chainId: ChainId.BOBA,
    logoURI: bobaLogo,
    rpcUrl: "https://mainnet.boba.network",
    explorerUrl: "https://blockexplorer.boba.network",
    constructExplorerLink: (txHash: string) =>
      `https://blockexplorer.boba.network/tx/${txHash}`,
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 551955,
  },
  {
    name: "Optimism",
    chainId: ChainId.OPTIMISM,
    logoURI: optimismLogo,
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "OETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 6979967,
  },
  {
    name: "Polygon",
    fullName: "Polygon Network",
    chainId: ChainId.POLYGON,
    logoURI: polygonLogo,
    rpcUrl: "https://rpc.ankr.com/polygon",
    explorerUrl: "https://polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://polygonscan.com"
    ),
    nativeCurrencySymbol: "MATIC",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 27875891,
  },
  {
    name: "Goerli",
    fullName: "Goerli Testnet",
    chainId: ChainId.GOERLI,
    logoURI: ethereumLogo,
    explorerUrl: "https://goerli.etherscan.io/",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://goerli.etherscan.io/"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 6586188,
  },
  {
    name: "Kovan",
    fullName: "Ethereum Testnet Kovan",
    chainId: ChainId.KOVAN,
    logoURI: ethereumLogo,
    explorerUrl: "https://kovan.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://kovan.etherscan.io"
    ),
    nativeCurrencySymbol: "KOV",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 31457386,
  },
  {
    name: "Optimism Kovan",
    fullName: "Optimism Testnet Kovan",
    chainId: ChainId.KOVAN_OPTIMISM,
    logoURI: optimismLogo,
    rpcUrl: "https://kovan.optimism.io",
    explorerUrl: "https://kovan-optimistic.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://kovan-optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "KOR",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 2537971,
  },
  {
    name: "Mumbai",
    chainId: ChainId.MUMBAI,
    logoURI: polygonLogo,
    rpcUrl: "https://matic-mumbai.chainstacklabs.com",
    explorerUrl: "https://mumbai.polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://mumbai.polygonscan.com"
    ),
    nativeCurrencySymbol: "WMATIC",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 25751326,
  },
  {
    name: "Arbitrum Rinkeby",
    fullName: "Arbitrum Testnet Rinkeby",
    chainId: ChainId.ARBITRUM_RINKEBY,
    logoURI: arbitrumLogo,
    explorerUrl: "https://rinkeby-explorer.arbitrum.io",
    constructExplorerLink: (txHash: string) =>
      `https://rinkeby-explorer.arbitrum.io/tx/${txHash}`,
    rpcUrl: "https://rinkeby.arbitrum.io/rpc",
    nativeCurrencySymbol: "ARETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 10523275,
  },
  {
    name: "Rinkeby",
    fullName: "Rinkeby Testnet",
    chainId: ChainId.RINKEBY,
    logoURI: ethereumLogo,
    explorerUrl: "https://rinkeby.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://rinkeby.etherscan.io"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 10485193,
  },
];

export const chainInfoTable: ChainInfoTable = Object.fromEntries(
  chainInfoList.map((chain) => {
    return [chain.chainId, chain];
  }, [])
);

export function getChainInfo(chainId: number): ChainInfo {
  assert(isSupportedChainId(chainId), "Unsupported chain id " + chainId);
  return chainInfoTable[chainId];
}
