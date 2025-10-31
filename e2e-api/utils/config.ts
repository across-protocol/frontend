import dotenv from "dotenv";
import * as sdk from "@across-protocol/sdk";
import { createMemoryClient, http, PREFUNDED_ACCOUNTS } from "tevm";
import { optimism, base } from "tevm/common";
import axios from "axios";
import nodeHttp from "http";
import https from "https";

dotenv.config({ path: [".env.e2e", ".env.local", ".env"] });

export const axiosInstance = axios.create({
  httpAgent: new nodeHttp.Agent({ keepAlive: false }),
  httpsAgent: new https.Agent({ keepAlive: false }),
});

export type SignerRole = "depositor" | "relayer";

export type RpcUrlMap = Record<number, string>;

export type E2EConfig = ReturnType<typeof makeE2EConfig>;

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

export function makeE2EConfig() {
  return (() => {
    const [depositor, relayer, recipient] = PREFUNDED_ACCOUNTS;

    const rpcUrls = buildRpcUrlMapFromEnv();
    const nodes = {
      [base.id]: createMemoryClient({
        common: base,
        fork: {
          transport: http(rpcUrls[base.id])({}),
          blockTag: "safe",
        },
        miningConfig: {
          type: "manual",
        },
      }),
      [optimism.id]: createMemoryClient({
        common: optimism,
        fork: {
          transport: http(rpcUrls[optimism.id])({}),
          blockTag: "safe",
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
      addresses: {
        depositor: depositor.address,
        relayer: relayer.address,
        recipient: recipient.address,
      },
    };
  })();
}

export const e2eConfig = makeE2EConfig();
