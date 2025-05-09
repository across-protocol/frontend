import { Balance, BalanceStrategy } from "./types";
import {
  getBalance,
  getNativeBalance,
  getConfig,
  getProvider,
  formatUnitsWithMaxFractions,
} from "utils";
import { ConvertDecimals } from "utils/convertdecimals";
import { useConnectionEVM } from "hooks/useConnectionEVM";

import { zeroBalance } from "../utils";

const equivalentBalanceTokens = {
  USDC: "USDC-BNB",
  USDT: "USDT-BNB",
  "USDC-BNB": "USDC",
  "USDT-BNB": "USDT",
};

export class EVMBalanceStrategy implements BalanceStrategy {
  constructor(
    private readonly connection: ReturnType<typeof useConnectionEVM>
  ) {}

  getAccount() {
    return this.connection.account;
  }

  async getBalance(
    chainId: number,
    tokenSymbol: string,
    account: string
  ): Promise<Balance> {
    const config = getConfig();
    let tokenInfo = config.getTokenInfoBySymbolSafe(chainId, tokenSymbol);
    const provider =
      this.connection.chainId === chainId
        ? this.connection.provider
        : getProvider(chainId);

    if (!tokenInfo || !tokenInfo.addresses?.[chainId]) {
      return zeroBalance;
    }

    let tokenAddress: string | undefined = tokenInfo?.addresses?.[chainId];
    const equivalentBalanceTokenSymbol =
      equivalentBalanceTokens[
        tokenSymbol as keyof typeof equivalentBalanceTokens
      ];
    if (!tokenAddress && equivalentBalanceTokenSymbol) {
      tokenInfo = config.getTokenInfoBySymbolSafe(
        chainId,
        equivalentBalanceTokenSymbol
      );
      tokenAddress = tokenInfo?.addresses?.[chainId];
    }
    if (!tokenAddress) {
      return zeroBalance;
    }

    const balance = tokenInfo?.isNative
      ? await getNativeBalance(chainId, account, "latest", provider)
      : await getBalance(chainId, account, tokenAddress, "latest", provider);
    const balanceDecimals = tokenInfo?.decimals ?? 18;
    return {
      balance,
      // We convert the balance to 18 decimals to be able to compare balances of tokens
      // with the same symbol but different decimals, e.g. USDC/USDT on BSC.
      balanceComparable: ConvertDecimals(balanceDecimals, 18)(balance),
      balanceFormatted: formatUnitsWithMaxFractions(balance, balanceDecimals),
    };
  }
}
