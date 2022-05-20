import assert from "assert";
import { clients, utils, BlockFinder } from "@uma/sdk";
import {
  relayFeeCalculator,
  lpFeeCalculator,
  contracts,
} from "@across-protocol/sdk-v2";
import { Provider, Block } from "@ethersproject/providers";
import { ethers, BigNumber } from "ethers";

import {
  MAX_RELAY_FEE_PERCENT,
  ChainId,
  hubPoolChainId,
  hubPoolAddress,
  getProvider,
  getConfigStoreAddress,
  queriesTable,
  FLAT_RELAY_CAPITAL_FEE,
} from "./constants";

import { parseEther, tagAddress } from "./format";
import { getConfig } from "utils";

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
};

export async function getRelayerFee(
  tokenSymbol: string,
  amount: ethers.BigNumber,
  toChainId: ChainId
): Promise<{
  relayerFee: Fee;
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  isAmountTooLow: boolean;
}> {
  const config = relayFeeCalculatorConfig(toChainId);
  const calculator = new relayFeeCalculator.RelayFeeCalculator(config);
  const result = await calculator.relayerFeeDetails(amount, tokenSymbol);

  return {
    relayerFee: {
      pct: ethers.BigNumber.from(result.relayFeePercent),
      total: ethers.BigNumber.from(result.relayFeeTotal),
    },
    relayerGasFee: {
      pct: ethers.BigNumber.from(result.gasFeePercent),
      total: ethers.BigNumber.from(result.gasFeeTotal),
    },
    relayerCapitalFee: {
      pct: ethers.BigNumber.from(result.capitalFeePercent),
      total: ethers.BigNumber.from(result.capitalFeeTotal),
    },
    isAmountTooLow: result.isAmountTooLow,
  };
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
  result.total = amount.mul(result.pct).div(parseEther("1"));
  return result;
}

type GetBridgeFeesArgs = {
  amount: ethers.BigNumber;
  tokenSymbol: string;
  blockTimestamp: number;
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
 * @returns Returns the `relayerFee` and `lpFee` fees for bridging the given amount of tokens, along with an `isAmountTooLow` flag indicating whether the amount is too low to bridge and an `isLiquidityInsufficient` flag indicating whether the liquidity is insufficient.
 */
export async function getBridgeFees({
  amount,
  tokenSymbol,
  blockTimestamp,
  toChainId,
}: GetBridgeFeesArgs): Promise<GetBridgeFeesResult> {
  const config = getConfig();
  const l1TokenAddress = config.getL1TokenAddressBySymbol(tokenSymbol);
  const { relayerFee, relayerGasFee, relayerCapitalFee, isAmountTooLow } =
    await getRelayerFee(tokenSymbol, amount, toChainId);

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
  };
}

export const getConfirmationDepositTime = () => {
  return "~1-3 minutes";
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
      ? tagAddress(tx.data!, referrer)
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
    return pooledTokens.liquidReserves.lt(amount);
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
