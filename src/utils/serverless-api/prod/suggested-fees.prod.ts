import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { Fee } from "utils/bridge";
import { ChainId } from "utils/constants";

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
  originToken: string,
  toChainid: ChainId,
  fromChainid: ChainId
): Promise<{
  relayerFee: Fee;
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  isAmountTooLow: boolean;
  quoteTimestamp: ethers.BigNumber;
  quoteBlock: ethers.BigNumber;
}> {
  const response = await axios.get(`/api/suggested-fees`, {
    params: {
      token: originToken,
      destinationChainId: toChainid,
      originChainId: fromChainid,
      amount: amount.toString(),
      skipAmountLimit: true,
    },
  });
  const result = response.data;
  const relayFeePct = BigNumber.from(result["relayFeePct"]);
  const relayFeeTotal = BigNumber.from(result["relayFeeTotal"]);

  const capitalFeePct = BigNumber.from(result["capitalFeePct"]);
  const capitalFeeTotal = BigNumber.from(result["capitalFeeTotal"]);

  const relayGasFeePct = BigNumber.from(result["relayGasFeePct"]);
  const relayGasFeeTotal = BigNumber.from(result["relayGasFeeTotal"]);

  const isAmountTooLow = result["isAmountTooLow"];

  const quoteTimestamp = BigNumber.from(result["timestamp"]);
  const quoteBlock = BigNumber.from(result["quoteBlock"]);

  return {
    relayerFee: {
      pct: relayFeePct,
      total: relayFeeTotal,
    },
    relayerCapitalFee: {
      pct: capitalFeePct,
      total: capitalFeeTotal,
    },
    relayerGasFee: {
      pct: relayGasFeePct,
      total: relayGasFeeTotal,
    },
    isAmountTooLow,
    quoteTimestamp,
    quoteBlock,
  };
}
