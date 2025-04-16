import { BigNumber } from "ethers";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BalanceStrategy } from "./types";
import { getConfig } from "utils";
import { useConnectionSVM } from "hooks/useConnectionSVM";

export class SVMBalanceStrategy implements BalanceStrategy {
  constructor(
    private readonly connection: ReturnType<typeof useConnectionSVM>
  ) {}

  getAccount() {
    return this.connection.account?.toString();
  }

  async getBalance(
    chainId: number,
    tokenSymbol: string,
    account: string
  ): Promise<BigNumber> {
    const config = getConfig();
    const tokenInfo = config.getTokenInfoBySymbolSafe(chainId, tokenSymbol);

    if (!tokenInfo || !tokenInfo.addresses?.[chainId]) {
      return BigNumber.from(0);
    }

    if (tokenInfo.isNative) {
      // Get native SOL balance
      const balance = await this.connection.provider.getBalance(
        new PublicKey(account)
      );
      return BigNumber.from(balance.toString());
    } else {
      // Get SPL token balance
      const tokenMint = new PublicKey(tokenInfo.addresses[chainId]);
      const owner = new PublicKey(account);

      // Get the associated token account address
      const tokenAccount = getAssociatedTokenAddressSync(
        tokenMint,
        owner,
        true, // allowOwnerOffCurve
        TOKEN_PROGRAM_ID
      );

      try {
        // Get token account info
        const tokenAccountInfo =
          await this.connection.provider.getTokenAccountBalance(tokenAccount);
        return BigNumber.from(tokenAccountInfo.value.amount);
      } catch (error) {
        // If token account doesn't exist or other error, return 0 balance
        return BigNumber.from(0);
      }
    }
  }
}
