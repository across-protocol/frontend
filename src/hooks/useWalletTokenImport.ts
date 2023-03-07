import { ERC20__factory } from "@across-protocol/contracts-v2";
import { providers } from "ethers";
import { useCallback } from "react";
import { useConnection } from "./useConnection";

export function useWalletTokenImport() {
  const { signer } = useConnection();
  const importTokenIntoWallet = useCallback(
    (address: string, symbol: string, decimals: number) =>
      importTokenToWallet(signer)(address, symbol, decimals),
    [signer]
  );
  const importTokenIntoWalletFromLookup = useCallback(
    (address: string) => importTokenToWalletFromLookup(signer)(address),
    [signer]
  );
  return { importTokenIntoWallet, importTokenIntoWalletFromLookup };
}

/**
 * Attempts to import an ERC20 token into a user's wallet
 * @param signer The JsonRpcSigner that is generated from a wallet
 * @returns void
 */
function importTokenToWallet(signer?: providers.JsonRpcSigner) {
  return async (
    address: string,
    symbol: string,
    decimals: number,
    base64EncodedImage?: string
  ) => {
    // Ensure that a signer is resolved, otherwise this is a no-op
    if (signer) {
      const parameters = {
        type: "ERC20",
        options: {
          address,
          symbol,
          decimals,
          image: base64EncodedImage,
        },
      };
      // Following EIP-747 we can call wallet_watchAsset to import a token
      // into the user's corresponding wallet
      await signer.provider.send(
        "wallet_watchAsset",
        parameters as unknown as any[]
      );
    }
  };
}

/**
 * Dynamically fetches the details of an ERC-20 token and attempts to import it into the signer's wallet
 * @param signer The JsonRpcSigner that is generated from a wallet
 * @returns void
 */
function importTokenToWalletFromLookup(signer?: providers.JsonRpcSigner) {
  return async (address: string, base64EncodedImage?: string) => {
    // Ensure that a signer is resolved, otherwise this is a no-op
    if (signer) {
      // Resolve an ERC20 token from the factory
      const ERC20 = ERC20__factory.connect(address, signer);
      // Resolve the ERC20's corresponding symbol
      const symbol = await ERC20.symbol();
      // Resolve the ERC20's corresponding decimal count
      const decimals = await ERC20.decimals();
      // Leverage code re-use and resolve the import closure
      const importFn = importTokenToWallet(signer);
      // Attempt to import the resolved token into the user's wallet
      await importFn(address, symbol, decimals, base64EncodedImage);
    }
  };
}
