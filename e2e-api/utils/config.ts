import dotenv from "dotenv";
import * as sdk from "@across-protocol/sdk";
import {
  Address,
  createMemoryClient,
  createTevmNode,
  http,
  PREFUNDED_ACCOUNTS,
} from "tevm";
import { optimism, mainnet } from "tevm/common";
import { Hex, PrivateKeyAccount } from "viem";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config({ path: [".env.e2e", ".env.local", ".env"] });

export type SignerRole = "depositor" | "relayer";

export type RpcUrlMap = Record<number, string>;

export type E2EConfig = {
  swapApiBaseUrl: string;
  getClient: (chainId: number) => ReturnType<typeof createMemoryClient>;
  ensureRpcForChains: (chainIds: number[]) => void;
  addresses: {
    depositor: Address;
    relayer: Address;
  };
  getAccount: (role: SignerRole) => PrivateKeyAccount;
};

function buildRpcUrlMapFromEnv(): RpcUrlMap {
  const map: RpcUrlMap = {};
  const env = process.env;

  // Find E2E_RPC_URL_<CHAIN_ID>
  for (const [key, value] of Object.entries(env)) {
    const m = key.match(/^E2E_RPC_URL_(\d+)$/);
    if (m && value) {
      const chainId = Number(m[1]);
      map[chainId] = value;
    }
  }

  return map;
}

export function getSpokePoolAddress(chainId: number): string {
  // Mirror api/_spoke-pool.ts logic without importing server code
  if (sdk.utils.chainIsSvm(chainId)) {
    return sdk.utils.getDeployedAddress("SvmSpoke", chainId) as string;
  }
  return sdk.utils.getDeployedAddress("SpokePool", chainId) as string;
}

export const e2eConfig: E2EConfig = (() => {
  const [depositor, relayer] = PREFUNDED_ACCOUNTS;

  const rpcUrls = buildRpcUrlMapFromEnv();
  const nodes = {
    [optimism.id]: createMemoryClient({
      loggingLevel: "info",
      common: optimism,
      fork: {
        transport: http(rpcUrls[optimism.id])({}),
        blockTag: 141174438n,
      },
      miningConfig: {
        type: "manual",
      },
    }),
    [mainnet.id]: createMemoryClient({
      common: mainnet,
      fork: {
        transport: http(rpcUrls[mainnet.id])({}),
        blockTag: "latest",
      },
      miningConfig: {
        type: "manual",
      },
    }),
  };

  const swapApiBaseUrl =
    process.env.E2E_TESTS_SWAP_API_BASE_URL || "https://app.across.to";

  const getClient = (chainId: number) => {
    const client = nodes[chainId];
    if (!client) {
      throw new Error(
        `Missing RPC URL for chainId ${chainId}. Set E2E_RPC_URL_${chainId}.`
      );
    }
    return client;
  };

  const getAccount = (role: SignerRole) => {
    if (role === "depositor") {
      return depositor;
    }
    return relayer;
  };

  const ensureRpcForChains = (chainIds: number[]) => {
    const missing = chainIds.filter((id) => !rpcUrls[id]);
    if (missing.length) {
      throw new Error(
        `Missing RPC URLs for chainIds: ${missing.join(", ")}. Please set 'E2E_RPC_URL_<ID>'.`
      );
    }
  };

  return {
    swapApiBaseUrl,
    rpcUrls,
    getClient,
    getAccount,
    ensureRpcForChains,
    addresses: { depositor: depositor.address, relayer: relayer.address },
  };
})();

export default e2eConfig;
