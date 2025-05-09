import { BigNumber } from "ethers";

export type Balance = {
  balance: BigNumber;
  balanceFormatted: string;
  balanceComparable: BigNumber;
};

export interface BalanceStrategy {
  getAccount(): string | undefined;
  getBalance(
    chainId: number,
    tokenSymbol: string,
    account?: string
  ): Promise<Balance>;
}
