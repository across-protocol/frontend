import { clients, across } from "@uma/sdk";
import { BridgePoolEthers__factory } from "@uma/contracts-frontend";
import { ethers } from "ethers";
import { PROVIDERS, TOKENS_LIST } from "utils";

import { ADDRESSES, CHAINS, ChainId } from "./constants";
import { isValidString, parseEther } from "./format";

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

const { constants, gasFeeCalculator } = across;

// currently available constants
const {
  FAST_ETH_GAS,
  FAST_ERC_GAS,
  FAST_UMA_GAS,
  SLOW_ETH_GAS,
  SLOW_ERC_GAS,
  SLOW_UMA_GAS,
} = constants;

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
  const gasAmountFast =
    token === "ETH"
      ? FAST_ETH_GAS - SLOW_ETH_GAS
      : token === "UMA"
      ? FAST_UMA_GAS - SLOW_UMA_GAS
      : FAST_ERC_GAS - SLOW_ERC_GAS;

  const gasAmountSlow =
    token === "ETH"
      ? SLOW_ETH_GAS
      : token === "UMA"
      ? SLOW_UMA_GAS
      : SLOW_ERC_GAS;

  const gasFeesSlow = await gasFeeCalculator(
    provider,
    amount,
    gasAmountSlow,
    l1Equivalent === ethers.constants.AddressZero ? undefined : l1Equivalent
  );
  const gasFeesFast = await gasFeeCalculator(
    provider,
    amount,
    gasAmountFast,
    l1Equivalent === ethers.constants.AddressZero ? undefined : l1Equivalent
  );

  const totalFees = ethers.BigNumber.from(gasFeesSlow.gasFees).add(
    gasFeesFast.gasFees
  );

  // amount*0.25 <= totalFees <==> amount*25 <= totalFees * 100
  const isFeeMoreThan25Percent = amount.mul(25).lte(totalFees.mul(100));

  return {
    instantRelayFee: {
      pct: ethers.BigNumber.from(gasFeesFast.feesAsPercent),
      total: ethers.BigNumber.from(gasFeesFast.gasFees),
    },
    slowRelayFee: {
      pct: ethers.BigNumber.from(gasFeesSlow.feesAsPercent),
      total: ethers.BigNumber.from(gasFeesSlow.gasFees),
    },
    isAmountTooLow: isFeeMoreThan25Percent,
  };
}

const RATE_MODEL = {
  UBar: parseEther("0.65"),
  R0: parseEther("0.00"),
  R1: parseEther("0.08"),
  R2: parseEther("1.00"),
};
const { calculateRealizedLpFeePct } = across.feeCalculator;
export async function getLpFee(
  tokenSymbol: string,
  amount: ethers.BigNumber
): Promise<Fee> {
  const provider = PROVIDERS[ChainId.MAINNET]();
  const l1EqInfo = TOKENS_LIST[ChainId.MAINNET].find(
    (t) => t.symbol === tokenSymbol
  );

  if (!l1EqInfo) {
    throw new Error(`Token ${tokenSymbol} not found in TOKENS_LIST`);
  }
  const { bridgePool: bridgePoolAddress } = l1EqInfo;
  const bridgePool = BridgePoolEthers__factory.connect(
    bridgePoolAddress,
    provider
  );
  const [currentUt, nextUt] = await Promise.all([
    bridgePool.callStatic.liquidityUtilizationCurrent(),
    bridgePool.callStatic.liquidityUtilizationPostRelay(amount),
  ]);

  const realizedLpFeePct = calculateRealizedLpFeePct(
    RATE_MODEL,
    currentUt,
    nextUt
  );
  const total = amount.mul(realizedLpFeePct);
  return {
    pct: realizedLpFeePct,
    total,
  };
}
