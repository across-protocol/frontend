import { ethers } from "ethers";
import { getChainInfo, ChainId } from "./constants";
import { getConfig } from "utils";

export async function switchChain(
  provider: ethers.providers.Web3Provider,
  chainId: ChainId
) {
  const config = getConfig();
  const chainInfo = getChainInfo(chainId);
  try {
    await provider.send("wallet_switchEthereumChain", [
      {
        chainId: ethers.utils.hexValue(chainId),
      },
    ]);
  } catch (switchError: any) {
    // 4902 = Unrecognized chain ID -32603 = Internal JSON-RPC error
    if (switchError.code === 4902 || switchError.code === -32603) {
      try {
        const { name, symbol, decimals } = config.getNativeTokenInfo(chainId);
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: ethers.utils.hexValue(chainId),
            chainName: chainInfo.fullName ?? chainInfo.name,
            rpcUrls: [chainInfo.rpcUrl],
            blockExplorerUrls: [chainInfo.explorerUrl],
            nativeCurrency: { name, symbol, decimals },
          },
        ]);
      } catch (addError) {
        console.error(
          `Failed to add ${chainInfo.fullName ?? chainInfo.name}`,
          addError
        );
      }
    } else {
      console.error(
        `Failed to switch to ${chainInfo.fullName ?? chainInfo.name}`,
        switchError
      );
    }
  }
}

// export function isTestnet(chainId: ChainId): boolean {
//   return TESTNET_CHAINS_SELECTION.includes(chainId);
// }
