import { BigNumber } from "ethers";
import { ChainId } from "utils/utils";
import { BridgeLimitInterface } from "../types";

export async function retrieveLimitsMocked(
  _token: string | ChainId,
  _fromChainId: string | ChainId,
  _toChainId: string | ChainId
): Promise<BridgeLimitInterface> {
  return {
    minDeposit: BigNumber.from("317845960607070"),
    maxDeposit: BigNumber.from("1625976243310274613043"),
    maxDepositInstant: BigNumber.from("148518401181482545509"),
    maxDepositShortDelay: BigNumber.from("1625976243310274613043"),
  };
}
