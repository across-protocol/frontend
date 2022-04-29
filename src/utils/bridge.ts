import assert from "assert";
import { clients, across, utils, BlockFinder } from "@uma/sdk";
import { Coingecko } from "@uma/sdk";
import {
  relayFeeCalculator,
  lpFeeCalculator,
  pool,
  utils as acrossUtils,
} from "@across-protocol/sdk-v2";
import { Provider, Block } from "@ethersproject/providers";
import { ethers, BigNumber } from "ethers";
import {
  HubPool,
  HubPool__factory,
  SpokePool,
  SpokePool__factory,
} from "@across-protocol/contracts-v2";

import {
  CHAINS,
  ChainId,
  PROVIDERS,
  TOKENS_LIST,
  Token,
  CHAINS_SELECTION,
  SPOKE_ADDRESSES,
  HUBPOOL_ADDRESSES,
  HUBPOOL_CONFIG,
  HUBPOOL_CHAINID,
  RATEMODEL_ADDRESSES,
  MAX_RELAY_FEE_PERCENT,
  isProduction,
  TokenList,
} from "./constants";

import { isValidString, parseEther, tagAddress } from "./format";
import { isValidAddress } from "./address";

export function getSpokePool(
  chainId: ChainId,
  signer?: ethers.Signer
): SpokePool {
  const maybeAddress = SPOKE_ADDRESSES[chainId];
  if (!isValidString(maybeAddress)) {
    throw new Error(
      `No SpokePool supported on ${CHAINS[chainId].name} with chainId: ${chainId}`
    );
  }
  return SpokePool__factory.connect(
    maybeAddress,
    signer ?? PROVIDERS[chainId]()
  );
}

function getHubPoolChainId(sendingChain: ChainId): ChainId {
  switch (sendingChain) {
    case ChainId.ARBITRUM_RINKEBY:
    case ChainId.RINKEBY:
      return ChainId.RINKEBY;
    case ChainId.KOVAN_OPTIMISM:
    case ChainId.KOVAN:
      return ChainId.KOVAN;
    case ChainId.MUMBAI:
    case ChainId.GOERLI:
      return ChainId.GOERLI;
    default:
      return ChainId.MAINNET;
  }
}

export function getHubPool(
  fromChain: ChainId,
  signer?: ethers.Signer
): HubPool {
  const hubPoolChainId = getHubPoolChainId(fromChain);
  const maybeAddress = HUBPOOL_ADDRESSES[hubPoolChainId];
  if (
    !isValidAddress(maybeAddress) ||
    maybeAddress === ethers.constants.AddressZero
  ) {
    throw new Error(
      `No HubPool supported on ${CHAINS[hubPoolChainId].name} with chainId: ${hubPoolChainId}`
    );
  }
  return HubPool__factory.connect(
    maybeAddress,
    signer ?? PROVIDERS[hubPoolChainId]()
  );
}

export type Fee = {
  total: ethers.BigNumber;
  pct: ethers.BigNumber;
};

export type BridgeFees = {
  relayerFee: Fee;
  lpFee: Fee;
};

export async function getRelayerFee(
  tokenSymbol: string,
  amount: ethers.BigNumber,
  toChainId: ChainId
): Promise<{ relayerFee: Fee; isAmountTooLow: boolean }> {
  const config = relayFeeCalculatorConfig(toChainId);
  const calculator = new relayFeeCalculator.RelayFeeCalculator(config);
  const result = await calculator.relayerFeeDetails(amount, tokenSymbol);

  return {
    relayerFee: {
      pct: ethers.BigNumber.from(result.relayFeePercent),
      total: ethers.BigNumber.from(result.relayFeeTotal),
    },
    isAmountTooLow: result.isAmountTooLow,
  };
}

export async function getLpFee(
  tokenSymbol: string,
  amount: ethers.BigNumber,
  blockTime?: number
): Promise<Fee & { isLiquidityInsufficient: boolean }> {
  // eth and weth can be treated the same in this case, but the rate model only currently supports weth address
  // TODO: add address 0 to sdk rate model ( duplicate weth)
  if (tokenSymbol === "ETH") tokenSymbol = "WETH";

  const tokenInfo = TOKENS_LIST[HUBPOOL_CHAINID].find(
    (t) => t.symbol === tokenSymbol
  );

  if (!tokenInfo) {
    throw new Error(`Token ${tokenSymbol} not found in TOKENS_LIST`);
  }
  if (amount.lte(0)) {
    throw new Error(`Amount must be greater than 0.`);
  }
  const { address: tokenAddress } = tokenInfo;
  const provider = PROVIDERS[HUBPOOL_CHAINID]();
  const hubPoolAddress = HUBPOOL_CONFIG.hubPoolAddress;
  const rateModelStoreAddress = RATEMODEL_ADDRESSES[HUBPOOL_CHAINID];

  const result = {
    pct: BigNumber.from(0),
    total: BigNumber.from(0),
    isLiquidityInsufficient: false,
  };

  const lpFeeCalculator = new LpFeeCalculator(
    provider,
    hubPoolAddress,
    rateModelStoreAddress
  );
  result.pct = await lpFeeCalculator.getLpFeePct(
    tokenAddress,
    hubPoolAddress,
    amount,
    blockTime
  );
  result.total = amount.mul(result.pct).div(parseEther("1"));
  result.isLiquidityInsufficient = false;
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
  const { relayerFee, isAmountTooLow } = await getRelayerFee(
    tokenSymbol,
    amount,
    toChainId
  );

  const { isLiquidityInsufficient, ...lpFee } = await getLpFee(
    tokenSymbol,
    amount,
    blockTimestamp
  ).catch((err) => {
    if (isProduction()) {
      throw err;
    }
    // we catch this because it will always error when we have testnets enabled for coins not suppored
    // on a testnet. in production though all tokens should be supported.
    console.error("Error getting lp fee", err);
    return {
      pct: BigNumber.from(0),
      total: BigNumber.from(0),
      isLiquidityInsufficient: false,
    };
  });

  return {
    relayerFee,
    lpFee,
    isAmountTooLow,
    isLiquidityInsufficient,
  };
}

export const getConfirmationDepositTime = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.OPTIMISM:
    case ChainId.BOBA:
      return "~20 minutes";
    case ChainId.ARBITRUM:
      return "~10 minutes";
    case ChainId.MAINNET:
      return "~2 minutes";
  }
};

// General function to pull a token mapping from adress fromChain -> toChain with an optional list of symbols to exclude.
function getTokenPairMapping(
  fromChain: ChainId,
  toChain: ChainId,
  symbolsToExclude: string[] = []
): Record<string, string> {
  return Object.fromEntries(
    TOKENS_LIST[fromChain]
      .map((fromChainElement) => {
        if (symbolsToExclude.includes(fromChainElement.symbol)) return null;
        const toChainElement = TOKENS_LIST[toChain].find(
          ({ symbol }) => symbol === fromChainElement.symbol
        );
        if (!toChainElement) {
          return null;
        } else {
          return [fromChainElement.address, toChainElement.address];
        }
      })
      .filter(utils.exists)
  );
}

// This will be moved inside the SDK in the near future
export const optimismErc20Pairs = () => {
  return getTokenPairMapping(ChainId.MAINNET, ChainId.OPTIMISM, [
    "WETH",
    "ETH",
  ]);
};

// This will be moved inside the SDK in the near future
export const bobaErc20Pairs = () => {
  return getTokenPairMapping(ChainId.MAINNET, ChainId.BOBA, ["WETH", "ETH"]);
};

/**
 * Returns the list of tokens that can be sent from chain A to chain B, by computing their tokenList intersection and taking care of additional chain specific quirks.
 * @param chainA  the chain to bridge from, that is, the chain that tokens are sent from.
 * @param chainB  the destination chain, that is, where tokens will be sent.
 * @returns Returns a list of tokens that can be sent from chain A to chain B.
 */
export function filterTokensByDestinationChain(
  chainA: ChainId,
  chainB: ChainId
) {
  const filterByToChain = (token: Token) =>
    TOKENS_LIST[chainB].some((element) => element.symbol === token.symbol);

  if (chainA === ChainId.MAINNET && chainB === ChainId.OPTIMISM) {
    // Note: because of how Optimism treats WETH, it must not be sent over their canonical bridge.
    return TOKENS_LIST[chainA]
      .filter((element) => element.symbol !== "WETH")
      .filter(filterByToChain);
  }
  return TOKENS_LIST[chainA].filter(filterByToChain);
}

/**
 * Checks if its possible to bridge from chain A to chain B.
 * @param chainA  the chain to bridge from, that is, the chain that tokens are sent from.
 * @param chainB  the destination chain, that is, where tokens will be sent.
 * @returns Returns `true` if it is possible to bridge from chain A to chain B, `false` otherwise.
 */
export function canBridge(chainA: ChainId, chainB: ChainId): boolean {
  // can't bridge to itself
  if (chainA === chainB) {
    return false;
  }
  // check if they have at least one token in common
  return filterTokensByDestinationChain(chainA, chainB).length > 0;
}

/**
 *
 * @param fromChain the chain to bridge from, that is, the chain that tokens are sent from.
 * @returns The list of chains that can be bridged to from the given `fromChain`.
 */
export function getReacheableChains(fromChain: ChainId): ChainId[] {
  return CHAINS_SELECTION.filter((toChain) => canBridge(fromChain, toChain));
}

type AcrossDepositArgs = {
  fromChain: ChainId;
  toChain: ChainId;
  toAddress: string;
  amount: ethers.BigNumber;
  token: string;
  relayerFeePct: ethers.BigNumber;
  timestamp: ethers.BigNumber;
  referrer?: string;
};
type AcrossApprovalArgs = {
  chainId: ChainId;
  token: string;
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
    token,
    amount,
    toAddress: recipient,
    toChain: destinationChainId,
    relayerFeePct,
    timestamp: quoteTimestamp,
    referrer,
  }: AcrossDepositArgs
): Promise<ethers.providers.TransactionResponse> {
  const spokePool = getSpokePool(fromChain);
  const provider = PROVIDERS[fromChain]();
  const code = await provider.getCode(spokePool.address);
  if (!code) {
    throw new Error(`SpokePool not deployed at ${spokePool.address}`);
  }
  const isNativeCurrency = token === CHAINS[fromChain].nativeCurrencyAddress;
  const value = isNativeCurrency ? amount : ethers.constants.Zero;
  const originToken = isNativeCurrency
    ? TOKENS_LIST[fromChain][0].address
    : token;
  const tx = await spokePool.populateTransaction.deposit(
    recipient,
    originToken,
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
  { token, amount, chainId }: AcrossApprovalArgs
): Promise<ethers.providers.TransactionResponse> {
  const spokePool = getSpokePool(chainId, signer);
  const provider = PROVIDERS[chainId]();
  const code = await provider.getCode(spokePool.address);
  if (!code) {
    throw new Error(`SpokePool not deployed at ${spokePool.address}`);
  }
  const tokenContract = clients.erc20.connect(token, signer);
  return tokenContract.approve(spokePool.address, amount);
}

const { exists } = utils;
const { parseAndReturnRateModelFromString } = across.rateModel;
const { calculateRealizedLpFeePct } = lpFeeCalculator;
const { rateModelStore } = clients;

export default class LpFeeCalculator {
  private blockFinder: BlockFinder<Block>;
  private hubPoolInstance: pool.hubPool.Instance;
  private rateModelStoreInstance: clients.rateModelStore.Instance;
  constructor(
    private provider: Provider,
    hubPoolAddress: string,
    rateModelStoreAddress: string
  ) {
    this.blockFinder = new BlockFinder<Block>(provider.getBlock.bind(provider));
    this.hubPoolInstance = pool.hubPool.connect(hubPoolAddress, provider);
    this.rateModelStoreInstance = rateModelStore.connect(
      rateModelStoreAddress,
      provider
    );
  }
  async getLpFeePct(
    tokenAddress: string,
    hubPoolAddress: string,
    amount: utils.BigNumberish,
    timestamp?: number
  ) {
    amount = BigNumber.from(amount);
    assert(amount.gt(0), "Amount must be greater than 0");
    const { blockFinder, hubPoolInstance, rateModelStoreInstance, provider } =
      this;

    const targetBlock = exists(timestamp)
      ? await blockFinder.getBlockForTimestamp(timestamp)
      : await provider.getBlock("latest");
    assert(
      exists(targetBlock),
      "Unable to find target block for timestamp: " + timestamp || "latest"
    );
    const blockTag = targetBlock.number;

    const [currentUt, nextUt, rateModelForBlockHeight] = await Promise.all([
      hubPoolInstance.callStatic.liquidityUtilizationCurrent(tokenAddress, {
        blockTag,
      } as any),
      hubPoolInstance.callStatic.liquidityUtilizationPostRelay(
        tokenAddress,
        amount,
        { blockTag } as any
      ),
      rateModelStoreInstance.callStatic.l1TokenRateModels(tokenAddress, {
        blockTag,
      } as any),
    ]);

    // Parsing stringified rate model will error if the rate model doesn't contain exactly the expect ed keys or isn't
    // a JSON object.
    const rateModel = parseAndReturnRateModelFromString(
      rateModelForBlockHeight
    );

    return calculateRealizedLpFeePct(rateModel, currentUt, nextUt);
  }
}

class Queries implements relayFeeCalculator.QueryInterface {
  private coingecko: Coingecko;
  constructor(
    private provider: Provider,
    private tokens: TokenList,
    private mainnetTokens: TokenList,
    private priceSymbol = "eth",
    private defaultGas = "305572"
  ) {
    this.coingecko = new Coingecko();
  }
  getMainnetTokenInfo(tokenSymbol: string) {
    const info = this.mainnetTokens.find((x) => x.symbol === tokenSymbol);
    assert(info, `No token found in mainnet tokens for ${tokenSymbol}`);
    return info;
  }
  getTokenInfo(tokenSymbol: string) {
    const info = this.tokens.find((x) => x.symbol === tokenSymbol);
    assert(info, `No token found in tochain for ${tokenSymbol}`);
    return info;
  }
  async getTokenPrice(tokenSymbol: string): Promise<string | number> {
    if (tokenSymbol.toLowerCase() === "eth") return 1;
    const { address } = this.getMainnetTokenInfo(tokenSymbol);
    const [, tokenPrice] = await this.coingecko.getCurrentPriceByContract(
      address,
      this.priceSymbol.toLowerCase()
    );
    return tokenPrice;
  }
  async getTokenDecimals(tokenSymbol: string): Promise<number> {
    const info = this.getTokenInfo(tokenSymbol);
    return info.decimals;
  }
  async getGasCosts(): Promise<acrossUtils.BigNumberish> {
    const { gasPrice, maxFeePerGas } = await this.provider.getFeeData();
    const price = maxFeePerGas || gasPrice;
    assert(price, "Unable to get gas price");
    return acrossUtils.gasCost(this.defaultGas, price);
  }
}

export function relayFeeCalculatorConfig(
  chainId: ChainId
): relayFeeCalculator.RelayFeeCalculatorConfig {
  const provider = PROVIDERS[chainId]();
  const chainInfo = CHAINS[chainId];
  const tokens = TOKENS_LIST[chainId];
  // coingecko needs the mainnet token addresses to look up price
  const mainnetTokens = TOKENS_LIST[ChainId.MAINNET];
  const queries = new Queries(provider, tokens, mainnetTokens);
  return {
    nativeTokenDecimals: chainInfo.nativeCurrency.decimals,
    feeLimitPercent: MAX_RELAY_FEE_PERCENT,
    queries,
  };
}
