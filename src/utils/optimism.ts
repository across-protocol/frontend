import { ethers } from "ethers";

export async function switchToOptimism(
  provider: ethers.providers.JsonRpcProvider
) {
  try {
    await provider.send("wallet_switchEthereumChain", [
      {
        chainId: "0xa",
        rpcUrl: "https://mainnet.optimism.io",
      },
    ]);
  } catch (switchError) {
    console.error("Failed to switch to Optimism", switchError);
    return switchError;
  }
}
