import { BigNumber, ethers } from "ethers";
import { ChainId, getTokenByAddress } from "utils/constants";
import { SuggestedApiFeeReturnType } from "../types";
import { parseUnits } from "utils/format";
import { utils } from "@across-protocol/sdk-v2";

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
  _fromChainid: ChainId,
  _recipientAddress?: string
): Promise<SuggestedApiFeeReturnType> {
  const token = getTokenByAddress(_originToken);
  const decimals = token?.decimals ?? 18;

  return {
    totalRelayFee: {
      pct: parseUnits("0.1", 18),
      total: parseUnits("0.1", 18),
    },
    relayerCapitalFee: {
      pct: parseUnits("0.1", 18),
      total: parseUnits("0.1", 18),
    },
    relayerGasFee: {
      pct: parseUnits("0.1", 18),
      total: parseUnits("0.1", 18),
    },
    lpFee: {
      pct: parseUnits("0.1", 18),
      total: parseUnits("0.1", 18),
    },
    isAmountTooLow: false,
    quoteBlock: BigNumber.from("1"),
    quoteTimestamp: BigNumber.from(utils.getCurrentTime()),
  };
}
