import { ethers, Signer, BigNumberish, BigNumber } from "ethers";
import { pool } from "@across-protocol/sdk";

import {
  getConfigStoreAddress,
  ChainId,
  hubPoolAddress,
  hubPoolChainId,
  getConfig,
  toWeiSafe,
  getProvider,
} from "utils";

export const DEFAULT_GAS_PRICE = toWeiSafe(
  process.env.REACT_APP_DEFAULT_GAS_PRICE || "400",
  9
);
export const GAS_PRICE_BUFFER = toWeiSafe(
  process.env.REACT_APP_GAS_PRICE_BUFFER || "0",
  9
);
// Rounded up from a mainnet transaction sending eth gas limit
export const ADD_LIQUIDITY_ETH_GAS = ethers.BigNumber.from(100000);

export const DEFAULT_ADD_LIQUIDITY_ETH_GAS_ESTIMATE = estimateGas(
  ADD_LIQUIDITY_ETH_GAS,
  DEFAULT_GAS_PRICE,
  GAS_PRICE_BUFFER
);

export const UPDATE_GAS_INTERVAL_MS = parseInt(
  process.env.REACT_APP_UPDATE_GAS_INTERVAL_MS || "30000"
);

// for a dynamic gas estimation
export function estimateGas(
  gas: BigNumberish,
  gasPriceWei: BigNumberish,
  buffer: BigNumberish = BigNumber.from("0")
) {
  return BigNumber.from(gas).mul(BigNumber.from(gasPriceWei).add(buffer));
}

// this could be replaced eventually with a better gas estimator
export async function getGasPrice(
  provider: ethers.providers.Provider
): Promise<ethers.BigNumber> {
  const fees = await provider.getFeeData();
  return fees.maxFeePerGas || fees.gasPrice || (await provider.getGasPrice());
}

// calculate exact amount of gas needed for tx
export async function gasForAddEthLiquidity(
  signer: Signer,
  tokenAddress: string,
  balance: BigNumberish
) {
  const poolClient = getPoolClient();
  const contract = poolClient.createHubPoolContract(signer);
  return contract.estimateGas.addLiquidity(tokenAddress, balance, {
    value: balance,
  });
}

// combine all gas values to get a good gas estimate
export async function estimateGasForAddEthLiquidity(
  signer: Signer,
  tokenAddress: string,
  balance: BigNumberish = BigNumber.from("1")
) {
  const poolClient = getPoolClient();
  const { provider } = poolClient.deps;
  const gasPrice = await getGasPrice(provider);
  const gas = await gasForAddEthLiquidity(signer, tokenAddress, balance);
  return estimateGas(gas, gasPrice, GAS_PRICE_BUFFER);
}

export function makePoolClientConfig(chainId: ChainId): pool.Config {
  const config = getConfig();
  const configStoreAddress = ethers.utils.getAddress(
    getConfigStoreAddress(chainId)
  );
  return {
    chainId,
    hubPoolAddress,
    wethAddress: config.getWethAddress(),
    configStoreAddress,
    acceleratingDistributorAddress: config.getAcceleratingDistributorAddress(),
    merkleDistributorAddress: config.getMerkleDistributorAddress(),
  };
}

export let poolClient: undefined | pool.Client;

export function getPoolClient(): pool.Client {
  if (poolClient) return poolClient;
  const hubPoolConfig = makePoolClientConfig(hubPoolChainId);
  poolClient = new pool.Client(
    hubPoolConfig,
    {
      provider: getProvider(hubPoolChainId),
    },
    () => {}
  );
  return poolClient;
}
