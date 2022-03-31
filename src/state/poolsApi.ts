import * as acrossSdk from "@across-protocol/sdk-v2";
import { update } from "./pools";
import { store } from "../state";
import { POOL_CONFIG, POOL_CHAINID, PROVIDERS } from "utils";

const provider = PROVIDERS[POOL_CHAINID]();

const { Client } = acrossSdk.pool;

export function poolEventHandler(path: string[], data: any) {
  store.dispatch(update({ path, data }));
}

export const poolClient = new Client(
  POOL_CONFIG,
  {
    provider,
  },
  poolEventHandler
);

// Checks every 10 seconds for new Pool data on new transactions
poolClient.startInterval(10000);
