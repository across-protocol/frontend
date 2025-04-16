import { BigNumber } from "ethers";
import { BalanceStrategy } from "./types";
import { getBalance, getNativeBalance, getConfig, getProvider } from "utils";
import { useConnectionEVM } from "hooks/useConnectionEVM";

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
  ): Promise<BigNumber> {
    const config = getConfig();
    const tokenInfo = config.getTokenInfoBySymbolSafe(chainId, tokenSymbol);
    const provider =
      this.connection.chainId === chainId
        ? this.connection.provider
        : getProvider(chainId);

    if (!tokenInfo || !tokenInfo.addresses?.[chainId]) {
      return BigNumber.from(0);
    }

    if (tokenInfo.isNative) {
      return getNativeBalance(chainId, account, "latest", provider);
    } else {
      return getBalance(
        chainId,
        account,
        tokenInfo.addresses[chainId],
        "latest",
        provider
      );
    }
  }
}
