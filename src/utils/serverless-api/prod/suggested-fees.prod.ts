import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { ChainId, vercelApiBaseUrl } from "utils/constants";
import { SuggestedApiFeeReturnType } from "../types";

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
