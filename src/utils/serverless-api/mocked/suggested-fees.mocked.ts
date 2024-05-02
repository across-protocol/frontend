import { BigNumber, ethers } from "ethers";
import { ChainId, getTokenByAddress } from "utils/constants";
import { SuggestedApiFeeReturnType } from "../types";
import { parseUnits } from "utils/format";

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
  _inputToken: string,
  _outputToken: string,
  _toChainid: ChainId,
  _fromChainid: ChainId,
  _recipientAddress?: string
): Promise<SuggestedApiFeeReturnType> {
  const token = getTokenByAddress(_inputToken);
  const decimals = token?.decimals ?? 18;

  return {
    totalRelayFee: {
      pct: BigNumber.from("1"),
      total: parseUnits("0.5", decimals),
    },
    relayerCapitalFee: {
      pct: BigNumber.from("1"),
      total: parseUnits("0.5", decimals),
    },
    relayerGasFee: {
      pct: BigNumber.from("1"),
      total: parseUnits("0.5", decimals),
    },
    lpFee: {
      pct: BigNumber.from("1"),
      total: parseUnits("0.5", decimals),
    },
    isAmountTooLow: false,
    quoteBlock: BigNumber.from("1"),
    quoteTimestamp: BigNumber.from("1"),
  };
}
