import { BigNumber, ethers } from "ethers";

export async function coingeckoMockedApiCall(
  l1Token: string,
  baseCurrency: string
): Promise<{
  price: ethers.BigNumber;
}> {
  return {
    price: BigNumber.from("0.1"),
  };
}
