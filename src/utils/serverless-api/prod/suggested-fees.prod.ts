import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { ChainId, vercelApiBaseUrl } from "utils/constants";
import { SuggestedApiFeeReturnType } from "../types";
import { getCurrentTime } from "utils/sdk";

/**
 * Creates an HTTP call to the `suggested-fees` API endpoint
 * @param amount The amount of fees to calculate
 * @param originToken The ERC20 token address from the origin chain
 * @param toChainid The destination chain number. The chain `amount` of `originToken` will be bridged to
 * @param fromChainid The origin chain number. The chain `amount` of `originToken` will be bridged from
 * @returns The result of the HTTP call to `api/suggested-fees`
 */
export async function suggestedFeesApiCall(
  amount: ethers.BigNumber,
  inputToken: string,
  outputToken: string,
  toChainid: ChainId,
  fromChainid: ChainId,
  recipientAddress?: string,
  message?: string
): Promise<SuggestedApiFeeReturnType> {
  if ([ChainId.SOLANA, ChainId.SOLANA_DEVNET].includes(fromChainid)) {
    return mockSuggestedFeesForSVM(
      amount,
      inputToken,
      outputToken,
      toChainid,
      fromChainid,
      recipientAddress,
      message
    );
  }

  const response = await axios.get(`${vercelApiBaseUrl}/api/suggested-fees`, {
    params: {
      inputToken,
      outputToken,
      destinationChainId: toChainid,
      originChainId: fromChainid,
      recipient: recipientAddress,
      amount: amount.toString(),
      skipAmountLimit: true,
      message,
      allowUnmatchedDecimals: true,
    },
  });
  const result = response.data;
  const totalRelayFeePct = BigNumber.from(result.totalRelayFee.pct);
  const totalRelayFeeTotal = BigNumber.from(result.totalRelayFee.total);

  const capitalFeePct = BigNumber.from(result.relayerCapitalFee.pct);
  const capitalFeeTotal = BigNumber.from(result.relayerCapitalFee.total);

  const relayGasFeePct = BigNumber.from(result.relayerGasFee.pct);
  const relayGasFeeTotal = BigNumber.from(result.relayerGasFee.total);

  const lpFeePct = BigNumber.from(result.lpFee.pct);
  const lpFeeTotal = BigNumber.from(result.lpFee.total);

  const isAmountTooLow = result["isAmountTooLow"];

  const quoteTimestamp = BigNumber.from(result["timestamp"]);
  const quoteBlock = BigNumber.from(result["quoteBlock"]);

  const minDeposit = BigNumber.from(result["limits"].minDeposit);
  const maxDeposit = BigNumber.from(result["limits"].maxDeposit);
  const maxDepositInstant = BigNumber.from(result["limits"].maxDepositInstant);
  const maxDepositShortDelay = BigNumber.from(
    result["limits"].maxDepositShortDelay
  );

  const estimatedFillTimeSec = result["estimatedFillTimeSec"];
  const exclusiveRelayer = result["exclusiveRelayer"];
  const exclusivityDeadline = result["exclusivityDeadline"];

  return {
    totalRelayFee: {
      pct: totalRelayFeePct,
      total: totalRelayFeeTotal,
    },
    relayerCapitalFee: {
      pct: capitalFeePct,
      total: capitalFeeTotal,
    },
    relayerGasFee: {
      pct: relayGasFeePct,
      total: relayGasFeeTotal,
    },
    lpFee: {
      pct: lpFeePct,
      total: lpFeeTotal,
    },
    isAmountTooLow,
    quoteTimestamp,
    quoteBlock,
    limits: {
      maxDeposit,
      maxDepositInstant,
      maxDepositShortDelay,
      minDeposit,
    },
    estimatedFillTimeSec,
    exclusiveRelayer,
    exclusivityDeadline,
    fillDeadline: result.fillDeadline,
  };
}

async function mockSuggestedFeesForSVM(
  amount: ethers.BigNumber,
  inputToken: string,
  outputToken: string,
  toChainid: ChainId,
  fromChainid: ChainId,
  recipientAddress?: string,
  message?: string
) {
  const zeroBN = BigNumber.from(0);

  return {
    totalRelayFee: {
      pct: zeroBN,
      total: zeroBN,
    },
    relayerCapitalFee: {
      pct: zeroBN,
      total: zeroBN,
    },
    relayerGasFee: {
      pct: zeroBN,
      total: zeroBN,
    },
    lpFee: {
      pct: zeroBN,
      total: zeroBN,
    },
    isAmountTooLow: false,
    quoteTimestamp: BigNumber.from(getCurrentTime() - 15),
    quoteBlock: BigNumber.from(100),
    limits: {
      maxDeposit: amount.mul(3),
      maxDepositInstant: amount.mul(2),
      maxDepositShortDelay: amount,
      minDeposit: zeroBN,
    },
    estimatedFillTimeSec: 10,
    exclusiveRelayer: ethers.constants.AddressZero,
    exclusivityDeadline: 0,
    fillDeadline: getCurrentTime() + 4 * 60 * 60,
  };
}
