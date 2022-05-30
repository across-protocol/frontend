import { ethers } from "ethers";
import { formatEtherRaw, max } from "utils";

export default function maxClickHandler(
  balance: string,
  symbol: string,
  decimals: number,
  setInputValue: React.Dispatch<React.SetStateAction<string>>,
  gasEstimate?: ethers.BigNumber
) {
  let value = ethers.utils.formatUnits(balance, decimals);
  if (symbol !== "ETH") return setInputValue(value);
  value = formatEtherRaw(
    max("0", ethers.BigNumber.from(balance).sub(gasEstimate ?? "0"))
  );
  return setInputValue(value);
}
