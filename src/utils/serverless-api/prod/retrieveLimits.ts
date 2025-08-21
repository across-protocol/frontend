import axios from "axios";
import { ChainId, vercelApiBaseUrl } from "utils";
import { BridgeLimitInterface } from "../types";
import { BigNumber, utils } from "ethers";

export async function retrieveLimits(
  inputToken: string,
  outputToken: string,
  fromChainId: string | ChainId,
  toChainId: string | ChainId
): Promise<BridgeLimitInterface> {
  const { data } = await axios.get<BridgeLimitInterface>(
    `${vercelApiBaseUrl}/api/limits`,
    {
      params: {
        inputToken,
        outputToken,
        originChainId: fromChainId,
        destinationChainId: toChainId,
        allowUnmatchedDecimals: true,
      },
    }
  );
  return data;
}

export async function retrieveLimitsForSVM(
  _inputToken: string,
  _outputToken: string,
  _fromChainId: string | ChainId,
  _toChainId: string | ChainId
): Promise<BridgeLimitInterface> {
  const maxDeposit = utils.parseUnits("100", 6);

  return {
    maxDeposit,
    maxDepositInstant: maxDeposit,
    maxDepositShortDelay: maxDeposit,
    minDeposit: BigNumber.from(0),
  };
}
