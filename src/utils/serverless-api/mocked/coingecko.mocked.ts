import { ethers } from "ethers";

export async function coingeckoMockedApiCall(
  l1Token: string,
  baseCurrency: string
): Promise<{
  price: ethers.BigNumber;
}> {
  return {
    price: ethers.utils.parseEther(String("0.17")),
  };
}
