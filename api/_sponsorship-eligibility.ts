import { BigNumber, utils, constants } from "ethers";

import { Token } from "./_dexes/types";
import { getEnvs, parseJsonSafe } from "./_env";
import { TOKEN_SYMBOLS_MAP } from "./_constants";
import { getSponsorshipsFromIndexer } from "./_indexer-api";
import { getNormalizedSpotTokenSymbol } from "./_hypercore";
import {
  getDonationBoxAddress,
  getSponsoredEvmChainId,
} from "./_sponsorship-utils";
import { getCachedTokenBalance } from "./_balance";
import { ConvertDecimals } from "./_utils";
import { AcrossErrorCode, InputError } from "./_errors";

export type SponsorshipEligibilityPreChecks = Awaited<
  ReturnType<typeof getSponsorshipEligibilityPreChecks>
>;

const {
  SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN:
    _SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN,
  SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN:
    _SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN,
  SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT:
    _SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT,
  SPONSORED_SWAP_SLIPPAGE_TOLERANCE: _SPONSORED_SWAP_SLIPPAGE_TOLERANCE,
  MAX_BPS_TO_SPONSOR_LIMIT: _MAX_BPS_TO_SPONSOR_LIMIT,
} = getEnvs();

/**
 * Global daily limit for sponsored mint/burn transactions per input token.
 */
export const SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN = parseJsonSafe(
  _SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN,
  {
    [TOKEN_SYMBOLS_MAP.USDC.symbol]: constants.MaxUint256,
    [TOKEN_SYMBOLS_MAP.USDH.symbol]: constants.MaxUint256,
  }
);

/**
 * Per-user daily limit for sponsored mint/burn transactions per input token.
 */
export const SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN = parseJsonSafe(
  _SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN,
  {
    [TOKEN_SYMBOLS_MAP.USDC.symbol]: constants.MaxUint256,
    [TOKEN_SYMBOLS_MAP.USDH.symbol]: constants.MaxUint256,
  }
);

/**
 * Daily limit for number of sponsored account creations.
 */
export const SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT =
  _SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT
    ? Number(_SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT)
    : 10_000_000;

/**
 * Slippage tolerance for sponsored mint/burn transactions with swaps.
 * The value is expressed as 0 <= slippage <= 100, where 1 = 1%. Max. 2 decimals.
 */
export const SPONSORED_SWAP_SLIPPAGE_TOLERANCE =
  _SPONSORED_SWAP_SLIPPAGE_TOLERANCE
    ? Number(_SPONSORED_SWAP_SLIPPAGE_TOLERANCE)
    : 1;

/**
 * Maximum bps to sponsor limit for sponsored mint/burn transactions.
 */
export const MAX_BPS_TO_SPONSOR_LIMIT = _MAX_BPS_TO_SPONSOR_LIMIT
  ? Number(_MAX_BPS_TO_SPONSOR_LIMIT)
  : 5;

/**
 * List of token pairs that are eligible for sponsorship.
 */
export const SPONSORSHIP_ELIGIBLE_TOKEN_PAIRS = [
  {
    inputToken: "USDC",
    outputToken: "USDH-SPOT",
  },
];

/**
 * Input amount limits per token pair in input token decimals.
 */
export const INPUT_AMOUNT_LIMITS_PER_TOKEN_PAIR: {
  [inputTokenSymbol: string]: {
    [outputTokenSymbol: string]: BigNumber;
  };
} = {
  USDC: {
    "USDH-SPOT": utils.parseUnits("1000000", 6), // 1M USDC
    "USDT-SPOT": utils.parseUnits("1000000", 6), // 1M USDT
    "USDC-SPOT": utils.parseUnits("10000000", 6), // 10M USDC
    USDC: utils.parseUnits("1000000", 6), // 1M USDC
  },
  USDT: {
    "USDC-SPOT": utils.parseUnits("1000000", 6), // 1M USDT
    "USDT-SPOT": utils.parseUnits("10000000", 6), // 10M USDT
  },
};

export class SponsoredSwapSlippageTooHighError extends InputError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.SPONSORED_SWAP_SLIPPAGE_TOO_HIGH,
      },
      opts
    );
  }
}

export class MaxBpsToSponsorTooHighError extends InputError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.MAX_BPS_TO_SPONSOR_TOO_HIGH,
      },
      opts
    );
  }
}

export class SponsoredDonationBoxFundsInsufficientError extends InputError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.SPONSORED_DONATION_BOX_FUNDS_INSUFFICIENT,
      },
      opts
    );
  }
}

/**
 * Pre-checks if a mint/burn transaction is eligible for sponsorship _before_ calculating the
 * sponsorship amounts.
 *
 * Validates:
 * - Global daily limit
 * - Per-user daily limit
 * - Account creation daily limit
 *
 * @param params - Parameters for eligibility check
 * @returns Eligibility pre-checks or undefined if check fails
 */
export async function getSponsorshipEligibilityPreChecks(params: {
  inputToken: Token;
  amount: BigNumber;
  outputToken: Token;
  recipient: string;
}) {
  const inputAmountLimit =
    INPUT_AMOUNT_LIMITS_PER_TOKEN_PAIR[params.inputToken.symbol]?.[
      params.outputToken.symbol
    ];
  // If input amount is greater than the limit, short-circuit with undefined.
  // This will prevent routing via our sponsorship periphery contracts.
  if (!inputAmountLimit || params.amount.gt(inputAmountLimit)) {
    return undefined;
  }

  const isEligibleTokenPair = SPONSORSHIP_ELIGIBLE_TOKEN_PAIRS.some(
    (pair) =>
      pair.inputToken === params.inputToken.symbol &&
      pair.outputToken === params.outputToken.symbol
  );
  // If not eligible token pair, short-circuit with false values.
  // This will route through the unsponsored flows via our sponsorship periphery contracts.
  if (!isEligibleTokenPair) {
    return {
      isEligibleTokenPair: false,
      isWithinGlobalDailyLimit: false,
      isWithinUserDailyLimit: false,
      isWithinAccountCreationDailyLimit: false,
    };
  }

  const { totalSponsorships, userSponsorships, accountActivations } =
    await getSponsorshipsFromIndexer();

  const sponsoredChainId = getSponsoredEvmChainId(params.outputToken.chainId);
  if (!sponsoredChainId) {
    return undefined;
  }
  const { finalTokenSymbol, finalTokenAddress } = getSponsoredFinalToken(
    params.outputToken
  );

  const totalSponsorshipsForSponsoredChain = totalSponsorships
    .find((sponsorship) => sponsorship.chainId === sponsoredChainId)
    ?.finalTokens.find(
      (token) =>
        token.tokenAddress.toLowerCase() === finalTokenAddress.toLowerCase()
    ) || {
    tokenAddress: finalTokenAddress,
    evmAmountSponsored: BigNumber.from(0),
  };
  const userSponsorshipsForSponsoredChain = userSponsorships
    .find((sponsorship) => sponsorship.finalRecipient === params.recipient)
    ?.sponsorships.find(
      (sponsorship) => sponsorship.chainId === sponsoredChainId
    )
    ?.finalTokens.find(
      (token) =>
        token.tokenAddress.toLowerCase() === finalTokenAddress.toLowerCase()
    ) || {
    tokenAddress: finalTokenAddress,
    evmAmountSponsored: BigNumber.from(0),
  };
  const accountActivationsForSponsoredChain = accountActivations.length;

  const globalDailyLimit =
    SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN[finalTokenSymbol] ??
    BigNumber.from(0);
  const userDailyLimit =
    SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN[finalTokenSymbol] ??
    BigNumber.from(0);

  return {
    isEligibleTokenPair,
    isWithinGlobalDailyLimit: BigNumber.from(
      totalSponsorshipsForSponsoredChain.evmAmountSponsored
    ).lt(globalDailyLimit),
    isWithinUserDailyLimit: BigNumber.from(
      userSponsorshipsForSponsoredChain.evmAmountSponsored
    ).lt(userDailyLimit),
    isWithinAccountCreationDailyLimit:
      accountActivationsForSponsoredChain <
      SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT,
  };
}

/**
 * Asserts that the sponsored amount can be covered by the donation box and swap slippage.
 * @param params - Parameters for assertion
 * @returns True if the sponsored amount can be covered, false otherwise.
 */
export async function assertSponsoredAmountCanBeCovered(params: {
  inputToken: Token;
  outputToken: Token;
  maxBpsToSponsor: number;
  swapSlippageBps: number;
  inputAmount: BigNumber;
}) {
  const { swapSlippageBps, maxBpsToSponsor } = params;

  if (!isSponsoredSwapSlippageTolerable(swapSlippageBps)) {
    throw new SponsoredSwapSlippageTooHighError({
      message: `Sponsored swap slippage is too high: ${swapSlippageBps} bps`,
    });
  }

  if (!isMaxBpsToSponsorTolerable(maxBpsToSponsor)) {
    throw new MaxBpsToSponsorTooHighError({
      message: `Max bps to sponsor is too high: ${maxBpsToSponsor} bps`,
    });
  }

  if (!(await hasDonationBoxEnoughFunds(params))) {
    throw new SponsoredDonationBoxFundsInsufficientError({
      message: `Sponsored donation box funds are insufficient`,
    });
  }

  return true;
}

/**
 * Checks if the swap slippage is within the acceptable range. Checked after the
 * sponsorship amounts are calculated.
 * @param swapSlippageBps - The calculated swap slippage in bps.
 * @returns True if the swap slippage is within the acceptable range, false otherwise.
 */
export function isSponsoredSwapSlippageTolerable(swapSlippageBps: number) {
  const swapSlippage = swapSlippageBps / 100;
  return swapSlippage <= SPONSORED_SWAP_SLIPPAGE_TOLERANCE;
}

/**
 * Checks if maxBpsToSponsor is within the acceptable range. Checked after the
 * sponsorship amounts are calculated.
 * @param maxBpsToSponsor - The calculated maxBpsToSponsor in bps.
 * @returns True if the maxBpsToSponsor is within the acceptable range, false otherwise.
 */
export function isMaxBpsToSponsorTolerable(maxBpsToSponsor: number) {
  return maxBpsToSponsor <= MAX_BPS_TO_SPONSOR_LIMIT;
}

/**
 * Checks if the donation box has enough funds to cover the sponsorship amounts. Checked
 * after the sponsorship amounts are calculated.
 */
export async function hasDonationBoxEnoughFunds(params: {
  inputToken: Token;
  outputToken: Token;
  maxBpsToSponsor: number;
  inputAmount: BigNumber;
}) {
  const { inputToken, outputToken, maxBpsToSponsor, inputAmount } = params;

  const sponsoredChainId = getSponsoredEvmChainId(outputToken.chainId);

  if (!sponsoredChainId) {
    return false;
  }

  const { finalTokenAddress, finalTokenDecimals } =
    getSponsoredFinalToken(outputToken);
  const oftOrCctp = inputToken.symbol.includes("USDC") ? "cctp" : "oft";
  const donationBoxAddress = getDonationBoxAddress(
    outputToken.chainId,
    oftOrCctp
  );

  const maxSponsoredAmountInInputTokenDecimals = inputAmount
    .mul(utils.parseEther(maxBpsToSponsor.toString()))
    .div(utils.parseEther("10000"));
  const maxSponsoredAmountInFinalTokenDecimals = ConvertDecimals(
    inputToken.decimals,
    finalTokenDecimals
  )(maxSponsoredAmountInInputTokenDecimals);

  const donationBoxBalance = await getCachedTokenBalance(
    sponsoredChainId,
    donationBoxAddress,
    finalTokenAddress
  );

  return donationBoxBalance.gte(maxSponsoredAmountInFinalTokenDecimals);
}

/**
 * Gets the sponsored final token for the output token. E.g. for USDH-SPOT, it will return USDH.
 * @param outputToken - The output token.
 * @returns The sponsored final token.
 */
export function getSponsoredFinalToken(outputToken: Token) {
  const sponsoredChainId = getSponsoredEvmChainId(outputToken.chainId);
  const finalTokenSymbol = getNormalizedSpotTokenSymbol(
    outputToken.symbol
  ) as keyof typeof TOKEN_SYMBOLS_MAP;
  const finalToken = TOKEN_SYMBOLS_MAP[finalTokenSymbol];
  if (!finalToken) {
    throw new Error(
      `Sponsored final token not found for ${outputToken.symbol}`
    );
  }

  const finalTokenAddress = finalToken.addresses[sponsoredChainId];
  if (!finalTokenAddress) {
    throw new Error(
      `Sponsored final token address not found for ${outputToken.symbol} on chain ${sponsoredChainId}`
    );
  }
  return {
    finalTokenSymbol,
    finalTokenAddress,
    finalTokenDecimals: finalToken.decimals,
  };
}
