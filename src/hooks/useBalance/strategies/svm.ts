import { BigNumber } from "ethers";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { formatUnitsWithMaxFractions, getConfig, toAddressType } from "utils";
import { ConvertDecimals } from "utils/convertdecimals";
import { useConnectionSVM } from "hooks/useConnectionSVM";

import { Balance, BalanceStrategy } from "./types";
import { zeroBalance } from "../utils";

const config = getConfig();

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
    account = this.getAccount()
  ): Promise<Balance> {
    const tokenInfo = config.getTokenInfoBySymbolSafe(chainId, tokenSymbol);

    if (!tokenInfo?.addresses?.[chainId] || !account) {
      return zeroBalance;
    }

    const tokenAddressBase58 = toAddressType(
      tokenInfo.addresses[chainId]
    ).toBase58();
    const accountBase58 = toAddressType(account).toBase58();

    let balance: BigNumber;

    if (tokenInfo.isNative) {
      // Get native SOL balance
      const solBalance = await this.connection.provider.getBalance(
        new PublicKey(accountBase58)
      );
      balance = BigNumber.from(solBalance.toString());
    } else {
      // Get SPL token balance
      const tokenMint = new PublicKey(tokenAddressBase58);
      const owner = new PublicKey(accountBase58);

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
        balance = BigNumber.from(tokenAccountInfo.value.amount);
      } catch (error) {
        // If token account doesn't exist or other error, return 0 balance
        balance = BigNumber.from(0);
      }
    }

    const balanceDecimals = tokenInfo.decimals ?? 18;
    return {
      balance,
      balanceComparable: ConvertDecimals(balanceDecimals, 18)(balance),
      balanceFormatted: formatUnitsWithMaxFractions(balance, balanceDecimals),
    };
  }
}
