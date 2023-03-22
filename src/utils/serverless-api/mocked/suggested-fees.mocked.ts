import { BigNumber, ethers } from "ethers";
import { Fee } from "utils/bridge";
import { ChainId } from "utils/constants";
import { SuggestedApiFeeReturnType } from "../types";

/**
 * Creates a mocked variant of the suggestedAPI Call
 * @param _amount The amount of fees to calculate
 * @param _originToken The ERC20 token address from the origin chain
 * @param _toChainid The destination chain number. The chain `amount` of `originToken` will be bridged to
 * @param _fromChainid The origin chain number. The chain `amount` of `originToken` will be bridged from
 * @returns The result of the HTTP call to `api/suggested-fees`
 */
export async function suggestedFeesMockedApiCall(
  _amount: ethers.BigNumber,
  _originToken: string,
  _toChainid: ChainId,
  _fromChainid: ChainId
): Promise<SuggestedApiFeeReturnType> {
  return {
    relayerFee: {
      pct: BigNumber.from("1"),
      total: BigNumber.from("1"),
    },
    relayerCapitalFee: {
      pct: BigNumber.from("1"),
      total: BigNumber.from("1"),
    },
    relayerGasFee: {
      pct: BigNumber.from("1"),
      total: BigNumber.from("1"),
    },
    lpFee: {
      pct: BigNumber.from("1"),
      total: BigNumber.from("1"),
    },
    isAmountTooLow: false,
    quoteBlock: BigNumber.from("1"),
    quoteTimestamp: BigNumber.from("1"),
  };
}
