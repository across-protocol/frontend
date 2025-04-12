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
  if ([ChainId.SOLANA, ChainId.SOLANA_DEVNET].includes(Number(fromChainId))) {
    return retrieveLimitsForSVM(
      inputToken,
      outputToken,
      fromChainId,
      toChainId
    );
  }

  const { data } = await axios.get<BridgeLimitInterface>(
    `${vercelApiBaseUrl}/api/limits`,
    {
      params: {
        inputToken,
        outputToken,
        originChainId: fromChainId,
        destinationChainId: toChainId,
      },
    }
  );
  return data;
}

export async function retrieveLimitsForSVM(
  inputToken: string,
  outputToken: string,
  fromChainId: string | ChainId,
  toChainId: string | ChainId
): Promise<BridgeLimitInterface> {
  const maxDeposit = utils.parseUnits("100", 6);

  return {
    maxDeposit,
    maxDepositInstant: maxDeposit,
    maxDepositShortDelay: maxDeposit,
    minDeposit: BigNumber.from(0),
  };
}
