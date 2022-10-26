import assert from "assert";
import { clients, utils, BlockFinder } from "@uma/sdk";
import {
  relayFeeCalculator,
  lpFeeCalculator,
  contracts,
} from "@across-protocol/sdk-v2";
import { Provider, Block } from "@ethersproject/providers";
import { ethers, BigNumber } from "ethers";
import { BridgeLimits } from "hooks";

import {
  MAX_RELAY_FEE_PERCENT,
  ChainId,
  hubPoolChainId,
  hubPoolAddress,
  getConfigStoreAddress,
  queriesTable,
  FLAT_RELAY_CAPITAL_FEE,
  referrerDelimiterHex,
  usdcLpCushion,
  wethLpCushion,
  wbtcLpCushion,
  daiLpCushion,
} from "./constants";

import { parseEtherLike, tagAddress } from "./format";
import { getProvider } from "./providers";
import { getConfig } from "utils";
import getApiEndpoint from "./serverless-api";

export type Fee = {
  total: ethers.BigNumber;
  pct: ethers.BigNumber;
};

export type BridgeFees = {
  relayerFee: Fee;
  lpFee: Fee;
  // Note: relayerGasFee and relayerCapitalFee are components of relayerFee.
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  quoteTimestamp?: ethers.BigNumber;
};

export async function getRelayerFee(
  tokenSymbol: string,
  amount: ethers.BigNumber,
  fromChainId: ChainId,
  toChainId: ChainId
): Promise<{
  relayerFee: Fee;
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  isAmountTooLow: boolean;
  quoteTimestamp?: ethers.BigNumber;
}> {
  const address = getConfig().getTokenInfoBySymbol(
    fromChainId,
    tokenSymbol
  ).address;

  return getApiEndpoint().suggestedFees(amount, address, toChainId);
}

export async function getLpFee(
  l1TokenAddress: string,
  amount: ethers.BigNumber,
  blockTime?: number
): Promise<Fee & { isLiquidityInsufficient: boolean }> {
  if (amount.lte(0)) {
    throw new Error(`Amount must be greater than 0.`);
  }
  const provider = getProvider(hubPoolChainId);
  const configStoreAddress = getConfigStoreAddress(hubPoolChainId);

  const result = {
    pct: BigNumber.from(0),
    total: BigNumber.from(0),
    isLiquidityInsufficient: false,
  };

  const lpFeeCalculator = new LpFeeCalculator(
    provider,
    hubPoolAddress,
    configStoreAddress
  );
  result.pct = await lpFeeCalculator.getLpFeePct(
    l1TokenAddress,
    amount,
    blockTime
  );
  result.isLiquidityInsufficient =
    await lpFeeCalculator.isLiquidityInsufficient(l1TokenAddress, amount);
  result.total = amount.mul(result.pct).div(parseEtherLike("1"));
  return result;
}

type GetBridgeFeesArgs = {
  amount: ethers.BigNumber;
  tokenSymbol: string;
  blockTimestamp: number;
  fromChainId: ChainId;
  toChainId: ChainId;
};

type GetBridgeFeesResult = BridgeFees & {
  isAmountTooLow: boolean;
  isLiquidityInsufficient: boolean;
};

/**
 *
 * @param amount - amount to bridge
 * @param tokenSymbol - symbol of the token to bridge
 * @param blockTimestamp - timestamp of the block to use for calculating fees on
 * @param fromChain The origin chain of this bridge action
 * @param toChain The destination chain of this bridge action
 * @returns Returns the `relayerFee` and `lpFee` fees for bridging the given amount of tokens, along with an `isAmountTooLow` flag indicating whether the amount is too low to bridge and an `isLiquidityInsufficient` flag indicating whether the liquidity is insufficient.
 */
export async function getBridgeFees({
  amount,
  tokenSymbol,
  blockTimestamp,
  fromChainId,
  toChainId,
}: GetBridgeFeesArgs): Promise<GetBridgeFeesResult> {
  const config = getConfig();
  const l1TokenAddress = config.getL1TokenAddressBySymbol(tokenSymbol);
  const {
    relayerFee,
    relayerGasFee,
    relayerCapitalFee,
    isAmountTooLow,
    quoteTimestamp,
  } = await getRelayerFee(tokenSymbol, amount, fromChainId, toChainId);

  const { isLiquidityInsufficient, ...lpFee } = await getLpFee(
    l1TokenAddress,
    amount,
    blockTimestamp
  ).catch((err) => {
    console.error("Error getting lp fee", err);
    throw err;
  });

  return {
    relayerFee,
    relayerGasFee,
    relayerCapitalFee,
    lpFee,
    isAmountTooLow,
    isLiquidityInsufficient,
    quoteTimestamp,
  };
}

export const getConfirmationDepositTime = (
  amount: BigNumber,
  limits: BridgeLimits,
  toChain: ChainId,
  fromChain: ChainId
) => {
  const config = getConfig();
  const depositDelay = config.depositDelays()[fromChain] || 0;
  const getTimeEstimateString = (
    lowEstimate: number,
    highEstimate: number
  ): string => {
    return `~${lowEstimate + depositDelay}-${
      highEstimate + depositDelay
    } minutes`;
  };

  if (amount.lte(limits.maxDepositInstant)) {
    return getTimeEstimateString(1, 4);
  } else if (amount.lte(limits.maxDepositShortDelay)) {
    // This is just a rough estimate of how long 2 bot runs (1-4 minutes allocated for each) + an arbitrum transfer of 3-10 minutes would take.
    if (toChain === ChainId.ARBITRUM) return getTimeEstimateString(5, 15);

    // Optimism transfers take about 10-20 minutes anecdotally. Boba is presumed to be similar.
    if (toChain === ChainId.OPTIMISM || toChain === ChainId.BOBA)
      return getTimeEstimateString(12, 25);

    // Polygon transfers take 20-30 minutes anecdotally.
    if (toChain === ChainId.POLYGON) return getTimeEstimateString(20, 35);

    // Typical numbers for an arbitrary L2.
    return getTimeEstimateString(10, 30);
  }

  // If the deposit size is above those, but is allowed by the app, we assume the pool will slow relay it.
  return "~3-7 hours";
};

type AcrossDepositArgs = {
  fromChain: ChainId;
  toChain: ChainId;
  toAddress: string;
  amount: ethers.BigNumber;
  tokenAddress: string;
  relayerFeePct: ethers.BigNumber;
  timestamp: ethers.BigNumber;
  referrer?: string;
  isNative: boolean;
};
type AcrossApprovalArgs = {
  chainId: ChainId;
  tokenAddress: string;
  amount: ethers.BigNumber;
};
/**
 * Makes a deposit on Across.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link AcrossDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
export async function sendAcrossDeposit(
  signer: ethers.Signer,
  {
    fromChain,
    tokenAddress,
    amount,
    toAddress: recipient,
    toChain: destinationChainId,
    relayerFeePct,
    timestamp: quoteTimestamp,
    isNative,
    referrer,
  }: AcrossDepositArgs
): Promise<ethers.providers.TransactionResponse> {
  const config = getConfig();
  const spokePool = config.getSpokePool(fromChain);
  const provider = getProvider(fromChain);
  const code = await provider.getCode(spokePool.address);
  if (!code) {
    throw new Error(`SpokePool not deployed at ${spokePool.address}`);
  }
  const value = isNative ? amount : ethers.constants.Zero;
  const tx = await spokePool.populateTransaction.deposit(
    recipient,
    tokenAddress,
    amount,
    destinationChainId,
    relayerFeePct,
    quoteTimestamp,
    { value }
  );

  // do not tag a referrer if data is not provided as a hex string.
  tx.data =
    referrer && ethers.utils.isAddress(referrer)
      ? tagAddress(tx.data!, referrer, referrerDelimiterHex)
      : tx.data;

  return signer.sendTransaction(tx);
}

export async function sendAcrossApproval(
  signer: ethers.Signer,
  { tokenAddress, amount, chainId }: AcrossApprovalArgs
): Promise<ethers.providers.TransactionResponse> {
  const config = getConfig();
  const spokePool = config.getSpokePool(chainId, signer);
  const provider = getProvider(chainId);
  const code = await provider.getCode(spokePool.address);
  if (!code) {
    throw new Error(`SpokePool not deployed at ${spokePool.address}`);
  }
  const tokenContract = clients.erc20.connect(tokenAddress, signer);
  return tokenContract.approve(spokePool.address, amount);
}

const { exists } = utils;
const { calculateRealizedLpFeePct } = lpFeeCalculator;

export default class LpFeeCalculator {
  private blockFinder: BlockFinder<Block>;
  private hubPoolInstance: contracts.hubPool.Instance;
  private configStoreClient: contracts.acrossConfigStore.Client;
  constructor(
    private provider: Provider,
    hubPoolAddress: string,
    configStoreAddress: string
  ) {
    this.blockFinder = new BlockFinder<Block>(provider.getBlock.bind(provider));
    this.hubPoolInstance = contracts.hubPool.connect(hubPoolAddress, provider);
    this.configStoreClient = new contracts.acrossConfigStore.Client(
      configStoreAddress,
      provider
    );
  }
  async isLiquidityInsufficient(
    tokenAddress: string,
    amount: utils.BigNumberish
  ): Promise<boolean> {
    const [, pooledTokens] = await Promise.all([
      this.hubPoolInstance.callStatic.sync(tokenAddress),
      this.hubPoolInstance.callStatic.pooledTokens(tokenAddress),
    ]);

    let liquidReserves = pooledTokens.liquidReserves;

    if (
      ethers.utils.getAddress(tokenAddress) ===
      ethers.utils.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
    ) {
      // Add WETH cushion to LP liquidity.
      liquidReserves = pooledTokens.liquidReserves.sub(
        ethers.utils.parseEther(wethLpCushion)
      );
    } else if (
      ethers.utils.getAddress(tokenAddress) ===
      ethers.utils.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
    ) {
      // Add USDC cushion to LP liquidity.
      liquidReserves = pooledTokens.liquidReserves.sub(
        ethers.utils.parseUnits(usdcLpCushion, 6)
      );
    } else if (
      ethers.utils.getAddress(tokenAddress) ===
      ethers.utils.getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")
    ) {
      // Add WBTC cushion to LP liquidity.
      liquidReserves = pooledTokens.liquidReserves.sub(
        ethers.utils.parseUnits(wbtcLpCushion || "0", 8)
      );
    } else if (
      ethers.utils.getAddress(tokenAddress) ===
      ethers.utils.getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F")
    ) {
      // Add DAI cushion to LP liquidity.
      liquidReserves = pooledTokens.liquidReserves.sub(
        ethers.utils.parseUnits(daiLpCushion || "0", 18)
      );
    }

    return liquidReserves.lt(amount);
  }
  async getLpFeePct(
    tokenAddress: string,
    amount: utils.BigNumberish,
    timestamp?: number
  ) {
    amount = BigNumber.from(amount);
    assert(amount.gt(0), "Amount must be greater than 0");
    const { blockFinder, hubPoolInstance, configStoreClient, provider } = this;

    const targetBlock = exists(timestamp)
      ? await blockFinder.getBlockForTimestamp(timestamp)
      : await provider.getBlock("latest");
    assert(
      exists(targetBlock),
      "Unable to find target block for timestamp: " + timestamp || "latest"
    );
    const blockTag = targetBlock.number;

    const [currentUt, nextUt, rateModel] = await Promise.all([
      hubPoolInstance.callStatic.liquidityUtilizationCurrent(tokenAddress, {
        blockTag,
      }),
      hubPoolInstance.callStatic.liquidityUtilizationPostRelay(
        tokenAddress,
        amount,
        { blockTag }
      ),
      configStoreClient.getRateModel(tokenAddress, {
        blockTag,
      }),
    ]);
    return calculateRealizedLpFeePct(rateModel, currentUt, nextUt);
  }
}

export function relayFeeCalculatorConfig(
  chainId: ChainId
): relayFeeCalculator.RelayFeeCalculatorConfig {
  const config = getConfig();
  const provider = getProvider(chainId);
  const token = config.getNativeTokenInfo(chainId);

  if (!queriesTable[chainId])
    throw new Error(`No queries in queriesTable for chainId ${chainId}!`);

  const queries = queriesTable[chainId](provider);
  return {
    nativeTokenDecimals: token.decimals,
    feeLimitPercent: MAX_RELAY_FEE_PERCENT,
    capitalCostsPercent: FLAT_RELAY_CAPITAL_FEE,
    queries,
  };
}
