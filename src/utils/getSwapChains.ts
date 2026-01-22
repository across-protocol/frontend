import mainnetChains from "../data/chains_1.json";
import indirectChains from "../data/indirect_chains_1.json";

export type SwapChain = {
  chainId: number;
  name: string;
  publicRpcUrl: string;
  explorerUrl: string;
  logoUrl: string;
};

/**
 * Get swap chains data by combining mainnet and indirect chains
 * This mimics the logic from api/swap/chains/index.ts for faster frontend access
 */
export function getSwapChains(): SwapChain[] {
  const chains = mainnetChains;

  return [...chains, ...indirectChains].map((chain) => ({
    chainId: chain.chainId,
    name: chain.name,
    publicRpcUrl: chain.publicRpcUrl,
    explorerUrl: chain.explorerUrl,
    logoUrl: chain.logoUrl,
  }));
}
