import { clients, across, utils } from "@uma/sdk";
import { BridgePoolEthers__factory } from "@uma/contracts-frontend";
import { ethers, BigNumber } from "ethers";
import { Bridge } from "arb-ts";
import { SpokePool, SpokePool__factory } from '@across-protocol/contracts-v2';

import {
  SPOKES_ADDRESSES,
  CHAINS,
  ChainId,
  PROVIDERS,
  TOKENS_LIST,
  MAX_RELAY_FEE_PERCENT,
  Token,
  L2ChainId,
  CHAINS_SELECTION,
} from "./constants";

import { isValidString, parseEther, tagAddress } from "./format";
import { isL2 } from "./chains";

const lpFeeCalculator = new across.LpFeeCalculator(
  PROVIDERS[ChainId.MAINNET]()
);


export function getSpokePool(
  chainId: L2ChainId,
  signer?: ethers.Signer
): SpokePool {
  const maybeAddress = SPOKES_ADDRESSES[chainId];
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
): Promise<{ relayerFee: Fee, isAmountTooLow: boolean }> {
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
  // eth and weth can be treated the sasme same in this case, but the rate model only currently supports weth address
  // TODO: add address 0 to sdk rate model ( duplicate weth)
  if (tokenSymbol === "ETH") tokenSymbol = "WETH";

  const l1EqInfo = TOKENS_LIST[ChainId.MAINNET].find(
    (t) => t.symbol === tokenSymbol
  );

  if (!l1EqInfo) {
    throw new Error(`Token ${tokenSymbol} not found in TOKENS_LIST`);
  }
  if (amount.lte(0)) {
    throw new Error(`Amount must be greater than 0.`);
  }
  const { address: tokenAddress, bridgePool: bridgePoolAddress } = l1EqInfo;

  const result = {
    pct: BigNumber.from(0),
    total: BigNumber.from(0),
    isLiquidityInsufficient: false,
  };

  result.pct = await lpFeeCalculator.getLpFeePct(
    tokenAddress,
    bridgePoolAddress,
    amount,
    blockTime
  );
  result.total = amount.mul(result.pct).div(parseEther("1"));

  // TODO: move this into the sdk lp fee client
  const provider = PROVIDERS[ChainId.MAINNET]();
  const bridgePool = BridgePoolEthers__factory.connect(
    bridgePoolAddress,
    provider
  );
  const liquidityReserves = await bridgePool.liquidReserves();
  const pendingReserves = await bridgePool.pendingReserves();

  const isLiquidityInsufficient = liquidityReserves
    .sub(pendingReserves)
    .lte(amount);
  result.isLiquidityInsufficient = isLiquidityInsufficient;
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
 * @param chainA - the chain to bridge from, that is, the chain that tokens are sent from.
 * @param chainB - the destination chain, that is, where tokens will be sent.
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

export function getReacheableChains(fromChain: ChainId) {
  return CHAINS_SELECTION.filter((toChain) => filterTokensByDestinationChain(fromChain, toChain).length > 0);
}

const { OptimismBridgeClient } = across.clients.optimismBridge;
const { BobaBridgeClient } = across.clients.bobaBridge;

type BaseDepositArgs = {
  token: string;
  amount: ethers.BigNumber;
  toAddress: string;
};
type BaseApprovalArgs = {
  token: string;
  amount: ethers.BigNumber;
};

// ARBITRUM
type ArbitrumDepositArgs = BaseDepositArgs;
/**
 * Makes a deposit on Arbitrum canonical bridge.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link ArbitrumDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
async function sendArbitrumDeposit(
  signer: ethers.Signer,
  { toAddress, token, amount }: ArbitrumDepositArgs
): Promise<ethers.providers.TransactionResponse> {
  const provider = PROVIDERS[ChainId.ARBITRUM]();
  const account = await signer.getAddress();
  const bridge = await Bridge.init(signer, provider.getSigner(account));
  if (token === CHAINS[ChainId.ARBITRUM].ETHAddress) {
    return bridge.depositETH(amount);
  } else {
    const depositParams = await bridge.getDepositTxParams({
      erc20L1Address: token,
      amount,
      destinationAddress: toAddress,
    });
    return bridge.deposit(depositParams);
  }
}
type ArbitrumApprovalArgs = BaseApprovalArgs;
/**
 * Approves the Arbitrum Bridge for `token` and `amount`.
 * @param signer A valid signer, must be connected to a provider.
 * @param approvalArgs An object containing the {@link ArbitrumApprovalArgs arguments} to pass to the approve function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
async function sendArbitrumApproval(
  signer: ethers.Signer,
  { token, amount }: ArbitrumApprovalArgs
): Promise<ethers.providers.TransactionResponse> {
  const provider = PROVIDERS[ChainId.ARBITRUM]();
  const account = await signer.getAddress();
  const bridge = await Bridge.init(signer, provider.getSigner(account));
  return bridge.approveToken(token, amount);
}

// OPTIMISM
const optimismClient = new OptimismBridgeClient();
type OptimismDepositArgs = BaseDepositArgs;
type OptimismApprovalArgs = BaseApprovalArgs;
/**
 * Makes a deposit on Optimism canonical bridge.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link OptimismDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
async function sendOptimismDeposit(
  signer: ethers.Signer,
  { token, amount }: OptimismDepositArgs
): Promise<ethers.providers.TransactionResponse> {
  const bridge = new OptimismBridgeClient();
  if (token === CHAINS[ChainId.OPTIMISM].ETHAddress) {
    return bridge.depositEth(signer, amount);
  } else {
    const pairToken = optimismErc20Pairs()[token];
    if (!pairToken) {
      throw new Error(`Token ${token} not supported.`);
    }
    return bridge.depositERC20(signer, token, pairToken, amount);
  }
}
/**
 * Approves the Optimism Bridge for `token` and `amount`.
 * @param signer A valid signer, must be connected to a provider.
 * @param approvalArgs An object containing the {@link BobaApproval arguments} to pass to the approve function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
function sendOptimismApproval(
  signer: ethers.Signer,
  { token, amount }: OptimismApprovalArgs
): Promise<ethers.providers.TransactionResponse> {
  return optimismClient.approve(signer, token, amount);
}

// BOBA

const bobaClient = new BobaBridgeClient();
type BobaDepositArgs = BaseDepositArgs;
type BobaApprovalArgs = BaseApprovalArgs;
/**
 * Makes a deposit on Boba canonical bridge.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link BobaDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
async function sendBobaDeposit(
  signer: ethers.Signer,
  { token, amount }: BobaDepositArgs
): Promise<ethers.providers.TransactionResponse> {
  if (token === CHAINS[ChainId.BOBA].ETHAddress) {
    return bobaClient.depositEth(signer, amount);
  } else {
    const pairToken = bobaErc20Pairs()[token];
    if (!pairToken) {
      throw new Error(`Token ${token} not supported.`);
    }
    return bobaClient.depositERC20(signer, token, pairToken, amount);
  }
}
/**
 * Approves the Boba Bridge for `token` and `amount`.
 * @param signer A valid signer, must be connected to a provider.
 * @param approvalArgs An object containing the {@link BobaApproval arguments} to pass to the approve function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
function sendBobaApproval(
  signer: ethers.Signer,
  { token, amount }: BobaApprovalArgs
): Promise<ethers.providers.TransactionResponse> {
  return bobaClient.approve(signer, token, amount);
}

type AcrossDepositArgs = BaseDepositArgs & {
  fromChain: ChainId;
  toChain: ChainId;
  toAddress: string;
  amount: ethers.BigNumber;
  token: string;
  relayerFeePct: ethers.BigNumber;
  timestamp: number;
  referrer?: string;
};
type AcrossApprovalArgs = BaseApprovalArgs & {
  chainId: ChainId;
};
/**
 * Makes a deposit on Across.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link AcrossSendArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
async function sendAcrossDeposit(
  signer: ethers.Signer,
  { fromChain, token, amount, toAddress: recipient, toChain: destinationChainId, relayerFeePct, timestamp: quoteTimestamp, referrer }: AcrossDepositArgs
): Promise<ethers.providers.TransactionResponse> {
  if (!isL2(fromChain)) {
    throw new Error(
      "Across does not support mainnet deposits. The canonical bridge should be used instead."
    );
  }
  const spokePool = getSpokePool(fromChain);
  const isETH = token === CHAINS[fromChain].ETHAddress;
  const value = isETH ? amount : ethers.constants.Zero;
  const originToken = isETH ? TOKENS_LIST[fromChain][0].address : token;
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

async function sendAcrossApproval(
  signer: ethers.Signer,
  { token, amount, chainId }: AcrossApprovalArgs
): Promise<ethers.providers.TransactionResponse> {
  if (!isL2(chainId)) {
    throw new Error(
      "Across does not support mainnet deposits. The canonical bridge should be used instead."
    );
  }
  const spoke = getSpokePool(chainId, signer);
  const tokenContract = clients.erc20.connect(token, signer);
  return tokenContract.approve(spoke.address, amount);
}
type Route = {
  approve: (
    signer: ethers.Signer,
    args: AcrossApprovalArgs
  ) => Promise<ethers.providers.TransactionResponse>;
  deposit: (
    signer: ethers.Signer,
    args: AcrossDepositArgs
  ) => Promise<ethers.providers.TransactionResponse>;
};
/**
 * Returns the correct deposit and approval function to go from (and approve tokens) chain `fromChain` to chain `toChain`. Uses canonical bridges for going from Mainnet to an L2, and Across for everything else.
 * @param fromChain - the chain to bridge from, that is, the chain that tokens are sent from.
 * @param toChain - the destination chain, that is, where tokens will be sent.
 * @returns A {@link Route} object containing the deposit and approval functions.
 */
export function getRoute(fromChain: ChainId, toChain: ChainId): Route {
  if (fromChain !== ChainId.MAINNET) {
    return {
      approve: sendAcrossApproval,
      deposit: sendAcrossDeposit,
    };
  }

  switch (toChain) {
    case ChainId.OPTIMISM:
      return { approve: sendOptimismApproval, deposit: sendOptimismDeposit };

    case ChainId.BOBA:
      return { approve: sendBobaApproval, deposit: sendBobaDeposit };

    case ChainId.ARBITRUM:
      return { approve: sendArbitrumApproval, deposit: sendArbitrumDeposit };
    default:
      throw new Error(`Unsupported bridge ${toChain}`);
  }
}
