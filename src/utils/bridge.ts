import { clients, across, utils } from "@uma/sdk";
import { ethers, BigNumber } from "ethers";
import { HubPool, HubPool__factory, SpokePool, SpokePool__factory } from "@across-protocol/contracts-v2";

import {
  CHAINS,
  ChainId,
  PROVIDERS,
  TOKENS_LIST,
  MAX_RELAY_FEE_PERCENT,
  Token,
  CHAINS_SELECTION,
  SPOKE_ADDRESSES,
  HUBPOOL_ADDRESSES,
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
      return ChainId.RINKEBY;
    case ChainId.KOVAN_OPTIMISM:
      return ChainId.KOVAN;
    case ChainId.MUMBAI:
      return ChainId.GOERLI;
    default:
      return ChainId.MAINNET
  }
}

export function getHubPool(fromChain: ChainId, signer?: ethers.Signer): HubPool {
  const hubPoolChainId = getHubPoolChainId(fromChain);
  const maybeAddress = HUBPOOL_ADDRESSES[hubPoolChainId];
  if (!isValidAddress(maybeAddress) || maybeAddress === ethers.constants.AddressZero) {
    throw new Error(
      `No HubPool supported on ${CHAINS[hubPoolChainId].name} with chainId: ${hubPoolChainId}`
    );
  }
  return HubPool__factory.connect(maybeAddress, signer ?? PROVIDERS[hubPoolChainId]());
}
const { gasFeeCalculator } = across;

export type Fee = {
  total: ethers.BigNumber;
  pct: ethers.BigNumber;
};

export type BridgeFees = {
  relayerFee: Fee;
  lpFee: Fee;
};

export async function getRelayerFee(
  token: string,
  amount: ethers.BigNumber
): Promise<{ relayerFee: Fee; isAmountTooLow: boolean }> {
  const l1Equivalent = TOKENS_LIST[ChainId.MAINNET].find(
    (t) => t.symbol === token
  )?.address;
  if (!l1Equivalent) {
    throw new Error(`Token ${token} not found in TOKENS_LIST`);
  }
  const provider = PROVIDERS[ChainId.MAINNET]();
  const { instant, isAmountTooLow } =
    await gasFeeCalculator.getDepositFeesDetails(
      provider,
      amount,
      l1Equivalent,
      MAX_RELAY_FEE_PERCENT
    );

  return {
    relayerFee: {
      pct: ethers.BigNumber.from(instant.pct),
      total: ethers.BigNumber.from(instant.total),
    },
    isAmountTooLow,
  };
}

export async function getLpFee(
  tokenSymbol: string,
  amount: ethers.BigNumber,
  blockTime?: number
): Promise<Fee & { isLiquidityInsufficient: boolean }> {
  const result = {
    pct: parseEther("1"),
    total: BigNumber.from(0),
    isLiquidityInsufficient: false,
  };
  result.total = amount.mul(result.pct).div(parseEther("1"));
  return result;
}

type GetBridgeFeesArgs = {
  amount: ethers.BigNumber;
  tokenSymbol: string;
  blockTimestamp: number;
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
}: GetBridgeFeesArgs): Promise<GetBridgeFeesResult> {
  const { relayerFee, isAmountTooLow } = await getRelayerFee(
    tokenSymbol,
    amount
  );

  const { isLiquidityInsufficient, ...lpFee } = await getLpFee(
    tokenSymbol,
    amount,
    blockTimestamp
  );

  return {
    relayerFee,
    lpFee,
    isAmountTooLow,
    isLiquidityInsufficient,
  };
}

export const getEstimatedDepositTime = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.OPTIMISM:
    case ChainId.BOBA:
      return "~20 minutes";
    case ChainId.ARBITRUM:
      return "~10 minutes";
    case ChainId.MAINNET:
      return "~1-3 minutes";
  }
};

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
function canBridge(chainA: ChainId, chainB: ChainId): boolean {
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
  const originToken = isNativeCurrency ? TOKENS_LIST[fromChain][0].address : token;
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
