import * as acrossSdk from "@across-protocol/sdk-v2";
import { update } from "./pools";
import { store } from "../state";
import {
  getConfigStoreAddress,
  ChainId,
  hubPoolAddress,
  hubPoolChainId,
  getConfig,
} from "utils";
import { ethers } from "ethers";
import { getProvider } from "utils/providers";

const provider = getProvider();

const { Client } = acrossSdk.pool;

export function makePoolClientConfig(chainId: ChainId): acrossSdk.pool.Config {
  const config = getConfig();
  const configStoreAddress = ethers.utils.getAddress(
    getConfigStoreAddress(chainId)
  );
  return {
    chainId,
    hubPoolAddress,
    wethAddress: config.getWethAddress(),
    configStoreAddress,
  };
}

export function poolEventHandler(path: string[], data: any) {
  store.dispatch(update({ path, data }));
}

export let poolClient: undefined | acrossSdk.pool.Client;

export function getPoolClient(): acrossSdk.pool.Client {
  if (poolClient) return poolClient;
  const hubPoolConfig = makePoolClientConfig(hubPoolChainId);
  poolClient = new Client(
    hubPoolConfig,
    {
      provider,
    },
    poolEventHandler
  );
  // Checks every 10 seconds for new Pool data on new transactions
  poolClient.startInterval(10000);
  return poolClient;
}
