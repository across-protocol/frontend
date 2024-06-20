import { ethers } from "ethers";

export async function coingeckoMockedApiCall(
  _l1Token: string,
  _baseCurrency: string
): Promise<{
  price: ethers.BigNumber;
}> {
  return {
    price: ethers.utils.parseEther(String("0.17")),
  };
}
