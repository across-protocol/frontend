import { BigNumber, utils } from "ethers";

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
} = getEnvs();

/**
 * Global daily limit for sponsored mint/burn transactions per input token.
 */
export const SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN = parseJsonSafe(
  _SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN,
  {
    [TOKEN_SYMBOLS_MAP.USDC.symbol]: utils.parseUnits(
      "100",
      TOKEN_SYMBOLS_MAP.USDC.decimals
    ),
    [TOKEN_SYMBOLS_MAP.USDH.symbol]: utils.parseUnits(
      "100",
      TOKEN_SYMBOLS_MAP.USDH.decimals
    ),
  }
);

/**
 * Per-user daily limit for sponsored mint/burn transactions per input token.
 */
export const SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN = parseJsonSafe(
  _SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN,
  {
    [TOKEN_SYMBOLS_MAP.USDC.symbol]: utils.parseUnits(
      "10",
      TOKEN_SYMBOLS_MAP.USDC.decimals
    ),
    [TOKEN_SYMBOLS_MAP.USDH.symbol]: utils.parseUnits(
      "10",
      TOKEN_SYMBOLS_MAP.USDH.decimals
    ),
  }
);

/**
 * Daily limit for number of sponsored account creations.
 */
export const SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT =
  _SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT
    ? Number(_SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT)
    : 10;

/**
 * Slippage tolerance for sponsored mint/burn transactions with swaps.
 * The value is expressed as 0 <= slippage <= 100, where 1 = 1%. Max. 2 decimals.
 */
export const SPONSORED_SWAP_SLIPPAGE_TOLERANCE =
  _SPONSORED_SWAP_SLIPPAGE_TOLERANCE
    ? Number(_SPONSORED_SWAP_SLIPPAGE_TOLERANCE)
    : 0.5;

export class SponsoredSwapSlippageToHighError extends InputError {
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
  outputToken: Token;
  recipient: string;
}) {
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
    );
  const userSponsorshipsForSponsoredChain = userSponsorships
    .find((sponsorship) => sponsorship.finalRecipient === params.recipient)
    ?.sponsorships.find(
      (sponsorship) => sponsorship.chainId === sponsoredChainId
    )
    ?.finalTokens.find(
      (token) =>
        token.tokenAddress.toLowerCase() === finalTokenAddress.toLowerCase()
    );
  const accountActivationsForSponsoredChain = accountActivations.length;

  if (
    !totalSponsorshipsForSponsoredChain ||
    !userSponsorshipsForSponsoredChain ||
    !accountActivationsForSponsoredChain
  ) {
    return undefined;
  }

  const globalDailyLimit =
    SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN[finalTokenSymbol] ??
    BigNumber.from(0);
  const userDailyLimit =
    SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN[finalTokenSymbol] ??
    BigNumber.from(0);

  return {
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
  const { swapSlippageBps } = params;

  if (!isSponsoredSwapSlippageTolerable(swapSlippageBps)) {
    throw new SponsoredSwapSlippageToHighError({
      message: `Sponsored swap slippage is too high: ${swapSlippageBps} bps`,
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
  return swapSlippageBps <= SPONSORED_SWAP_SLIPPAGE_TOLERANCE;
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
  const donationBoxAddress = getDonationBoxAddress(outputToken.chainId);

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
