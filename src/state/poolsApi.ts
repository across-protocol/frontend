import { ethers } from "ethers";
import { multicallTwoAddress } from "utils";
import * as umaSDK from "@uma/sdk";
import { update } from "./pools";
import { store } from "../state";

const { Client } = umaSDK.across.clients.bridgePool;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
);

export function poolEventHandler(path: string[], data: any) {
  store.dispatch(update({ path, data }));
}

export const poolClient = new Client(
  {
    multicall2Address: multicallTwoAddress,
    confirmations: 1,
  },
  {
    provider,
  },
  poolEventHandler
);

// Checks every 30 seconds for new Pool data on new transactions
poolClient.startInterval(20000);
