import dotenv from "dotenv";

dotenv.config({
  path: [".env.e2e", ".env"],
});

export const IS_CI = process.env.CI === "true";
export const RUN_DEPOSIT_TESTS = process.env.E2E_RUN_DEPOSIT_TESTS === "true";

export const E2E_DAPP_URL = process.env.E2E_DAPP_URL || "http://127.0.0.1:3000";

// FIXME: For some reason importing `@across-protocol/constants` or `@across-protocol/sdk`
// breaks the tests. This is a temporary workaround.
export const CHAIN_IDs = {
  MAINNET: 1,
  OPTIMISM: 10,
  POLYGON: 137,
  BOBA: 288,
  ZK_SYNC: 324,
  BASE: 8453,
  MODE: 34443,
  ARBITRUM: 42161,
  LINEA: 59144,
  SCROLL: 534352,
  LISK: 1135,
};

export const MM_SEED_PHRASE =
  process.env.E2E_MM_SEED_PHRASE ||
  "test test test test test test test test test test test junk";
export const MM_PASSWORD =
  process.env.E2E_MM_PASSWORD || "SynpressIsAwesomeNow!!!";

const INFURA_ID =
  process.env.E2E_INFURA_ID || process.env.REACT_APP_PUBLIC_INFURA_ID;

export const chains = {
  [CHAIN_IDs.MAINNET]: {
    name: "Ethereum Mainnet",
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
  },
  [CHAIN_IDs.ARBITRUM]: {
    name: "Arbitrum",
    rpcUrl: `https://arb1.arbitrum.io/rpc`,
  },
  [CHAIN_IDs.OPTIMISM]: {
    name: "Optimism",
    rpcUrl: `https://mainnet.optimism.io`,
  },
  [CHAIN_IDs.POLYGON]: {
    name: "Polygon",
    rpcUrl: `https://rpc.ankr.com/polygon`,
  },
  [CHAIN_IDs.ZK_SYNC]: {
    name: "ZkSync Era",
    rpcUrl: `https://mainnet.era.zksync.io`,
  },
  [CHAIN_IDs.BASE]: {
    name: "Base",
    rpcUrl: `https://mainnet.base.org`,
  },
  [CHAIN_IDs.LINEA]: {
    name: "Linea",
    rpcUrl: `https://rpc.linea.build`,
  },
  [CHAIN_IDs.MODE]: {
    name: "Mode",
    rpcUrl: `https://mainnet.mode.network`,
  },
  [CHAIN_IDs.SCROLL]: {
    name: "Scroll",
    rpcUrl: `https://rpc.scroll.io`,
  },
  [CHAIN_IDs.LISK]: {
    name: "Lisk",
    rpcUrl: `https://rpc.api.lisk.com`,
  },
};
