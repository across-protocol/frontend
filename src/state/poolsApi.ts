import * as acrossSdk from "@across-protocol/sdk-v2";
import { update } from "./pools";
import { store } from "../state";
import { HUBPOOL_CONFIG, HUBPOOL_CHAINID, PROVIDERS } from "utils";

const provider = PROVIDERS[HUBPOOL_CHAINID]();

const { Client } = acrossSdk.pool;

export function poolEventHandler(path: string[], data: any) {
  store.dispatch(update({ path, data }));
}

export const poolClient = new Client(
  HUBPOOL_CONFIG,
  {
    provider,
  },
  poolEventHandler
);

// Checks every 10 seconds for new Pool data on new transactions
poolClient.startInterval(10000);
