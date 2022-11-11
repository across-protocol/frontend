import axios from "axios";
import { ethers } from "ethers";

export type CoingeckoApiCall = typeof coingeckoApiCall;

export async function coingeckoApiCall(
  l1Token: string,
  baseCurrency: string
): Promise<{
  price: ethers.BigNumber;
}> {
  const response = await axios.get(`/api/coingecko`, {
    params: {
      l1Token,
      baseCurrency,
    },
  });
  const result = response.data;
  const price =
    baseCurrency === "usd"
      ? ethers.utils.parseEther(result.price)
      : ethers.BigNumber.from(result.price);
  return {
    price,
  };
}
