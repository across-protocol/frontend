import { ethers } from "ethers";
import { multicallTwoAddress } from "utils";
import * as umaSDK from "@uma/sdk";
import { Pool, UserPoolData } from "./pools";

const { ReadClient } = umaSDK.across.clients.bridgePool;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.REACT_APP_PUBLIC_INFURA_ID}`
);

// have to make a singleton per pool because this class is not stateless
const readClients = new Map<
  string,
  umaSDK.across.clients.bridgePool.ReadClient
>();
function getReadClient(
  address: string
): umaSDK.across.clients.bridgePool.ReadClient {
  if (readClients.has(address))
    return readClients.get(
      address
    ) as umaSDK.across.clients.bridgePool.ReadClient;
  const readClient = new ReadClient(address, provider, multicallTwoAddress);
  readClients.set(address, readClient);
  return readClient;
}
export async function fetchPoolState(address: string) {
  try {
    const readClient = getReadClient(address);
    const res = await readClient.read();
    return res.pool;
  } catch (err) {
    return err;
  }
}

export interface FetchUserPoolDataResponse {
  user: UserPoolData;
  pool: Pool;
}

export async function fetchUserPoolData(account: string, poolAddress: string) {
  try {
    const readClient = getReadClient(poolAddress);
    const res = await readClient.read(account);
    // const modifiedUserData = { ...res.user, bridgeAddress: res.pool.address };
    // return { ...res.pool, user: modifiedUserData };
    return res;
  } catch (err) {
    return err;
  }
}
