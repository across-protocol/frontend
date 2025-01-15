import { CHAIN_IDs } from "@across-protocol/constants";
import { chainConfigs } from "./configs";

export type ChainInfo = (typeof chainConfigs)[0];
export type ChainInfoList = ChainInfo[];
export type ChainInfoTable = Record<number, ChainInfo>;
export type ChainId = (typeof CHAIN_IDs)[keyof typeof CHAIN_IDs];

export const ChainId = CHAIN_IDs;

// ordered enabled chains
const orderedEnabledChainIds = [
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.OPTIMISM,
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.ZK_SYNC,
  CHAIN_IDs.BASE,
  CHAIN_IDs.LINEA,
  CHAIN_IDs.MODE,
  CHAIN_IDs.BLAST,
  CHAIN_IDs.LISK,
  CHAIN_IDs.REDSTONE,
  CHAIN_IDs.SCROLL,
  CHAIN_IDs.ZORA,
  CHAIN_IDs.WORLD_CHAIN,
  CHAIN_IDs.ALEPH_ZERO,
  CHAIN_IDs.INK,
  CHAIN_IDs.SONEIUM,
  // testnet
  CHAIN_IDs.SEPOLIA,
  CHAIN_IDs.BASE_SEPOLIA,
  CHAIN_IDs.ARBITRUM_SEPOLIA,
  CHAIN_IDs.OPTIMISM_SEPOLIA,
  CHAIN_IDs.MODE_SEPOLIA,
  CHAIN_IDs.POLYGON_AMOY,
  CHAIN_IDs.BLAST_SEPOLIA,
  CHAIN_IDs.LISK_SEPOLIA,
];

export const chainInfoList: ChainInfoList = orderedEnabledChainIds.map(
  (chainId) => chainConfigs[chainId]
);

export const chainInfoTable: ChainInfoTable = Object.fromEntries(
  chainInfoList.map((chain) => {
    return [chain.chainId, chain];
  }, [])
);
