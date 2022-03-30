import { ethers } from "ethers";
import { CHAINS, ChainId, L2ChainId, TESTNET_CHAINS_SELECTION } from "./constants";

export async function switchChain(
  provider: ethers.providers.JsonRpcProvider,
  chainId: ChainId
) {
  try {
    await provider.send("wallet_switchEthereumChain", [
      {
        chainId: ethers.utils.hexValue(chainId),
      },
    ]);
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: ethers.utils.hexValue(chainId),
            chainName: CHAINS[chainId].fullName ?? CHAINS[chainId].name,
            rpcUrls: [CHAINS[chainId].rpcUrl],
            blockExplorerUrls: [CHAINS[chainId].explorerUrl],
            nativeCurrency: CHAINS[chainId].nativeCurrency,
          },
        ]);
      } catch (addError) {
        console.error(
          `Failed to add ${CHAINS[chainId].fullName ?? CHAINS[chainId].name}`,
          addError
        );
      }
    } else {
      console.error(
        `Failed to switch to ${CHAINS[chainId].fullName ?? CHAINS[chainId].name
        }`,
        switchError
      );
    }
  }
}

export function isSupportedChainId(chainId: number): chainId is ChainId {
  return chainId in ChainId;
}
export function isL2(
  chainId: ChainId
): chainId is L2ChainId {
  return ![ChainId.MAINNET, ChainId.RINKEBY, ChainId.KOVAN].includes(chainId);
}
export function isTestnet(chainId: ChainId): boolean {
  return TESTNET_CHAINS_SELECTION.includes(chainId);
}