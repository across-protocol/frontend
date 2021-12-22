import { clients, across } from "@uma/sdk";
import { BridgePoolEthers__factory } from "@uma/contracts-frontend";
import { ethers, BigNumber } from "ethers";

import {
  ADDRESSES,
  CHAINS,
  ChainId,
  PROVIDERS,
  TOKENS_LIST,
  MAX_RELAY_FEE_PERCENT,
} from "./constants";

import { isValidString, parseEther } from "./format";

const lpFeeCalculator = new across.LpFeeCalculator(
  PROVIDERS[ChainId.MAINNET]()
);

export function getDepositBox(
  chainId: ChainId,
  signer?: ethers.Signer
): clients.bridgeDepositBox.Instance {
  const maybeAddress = ADDRESSES[chainId].BRIDGE;
  if (!isValidString(maybeAddress)) {
    throw new Error(
      `Deposit Box not supported on ${CHAINS[chainId].name} with chainId: ${chainId}`
    );
  }
  return clients.bridgeDepositBox.connect(
    maybeAddress,
    signer ?? PROVIDERS[chainId]()
  );
}

const { gasFeeCalculator } = across;

export type Fee = {
  total: ethers.BigNumber;
  pct: ethers.BigNumber;
};

type RelayFees = {
  instantRelayFee: Fee;
  slowRelayFee: Fee;
};

export type BridgeFees = {
  instantRelayFee: Fee;
  slowRelayFee: Fee;
  lpFee: Fee;
};

export async function getRelayFees(
  token: string,
  amount: ethers.BigNumber
): Promise<RelayFees & { isAmountTooLow: boolean }> {
  const l1Equivalent = TOKENS_LIST[ChainId.MAINNET].find(
    (t) => t.symbol === token
  )?.address;
  if (!l1Equivalent) {
    throw new Error(`Token ${token} not found in TOKENS_LIST`);
  }
  const provider = PROVIDERS[ChainId.MAINNET]();
  const { instant, slow, isAmountTooLow } =
    await gasFeeCalculator.getDepositFeesDetails(
      provider,
      amount,
      l1Equivalent,
      MAX_RELAY_FEE_PERCENT
    );

  return {
    instantRelayFee: {
      pct: ethers.BigNumber.from(instant.pct),
      total: ethers.BigNumber.from(instant.total),
    },
    slowRelayFee: {
      pct: ethers.BigNumber.from(slow.pct),
      total: ethers.BigNumber.from(slow.total),
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

// This will be moved inside the SDK in the near future
export const optimismErc20Pairs = () => {
  const usdcMainnet = TOKENS_LIST[ChainId.MAINNET].filter(
    (token) => token.symbol === "USDC"
  )[0];
  const umaMainnet = TOKENS_LIST[ChainId.MAINNET].filter(
    (token) => token.symbol === "UMA"
  )[0];
  const usdcOptimism = TOKENS_LIST[ChainId.OPTIMISM].filter(
    (token) => token.symbol === "USDC"
  )[0];
  const umaOptimism = TOKENS_LIST[ChainId.OPTIMISM].filter(
    (token) => token.symbol === "UMA"
  )[0];

  return {
    [usdcMainnet.address]: usdcOptimism.address,
    [umaMainnet.address]: umaOptimism.address,
  };
};

// This will be moved inside the SDK in the near future
export const bobaErc20Pairs = () => {
  const usdcMainnet = TOKENS_LIST[ChainId.MAINNET].filter(
    (token) => token.symbol === "USDC"
  )[0];
  const usdcBoba = TOKENS_LIST[ChainId.BOBA].filter(
    (token) => token.symbol === "USDC"
  )[0];

  return {
    [usdcMainnet.address]: usdcBoba.address,
  };
};
