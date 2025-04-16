import { BigNumber } from "ethers";

export interface BalanceStrategy {
  getAccount(): string | undefined;
  getBalance(
    chainId: number,
    tokenSymbol: string,
    account: string
  ): Promise<BigNumber>;
}
