import { ChainId } from "utils/constants";
import { ethers } from "ethers";

export interface Transaction {
  timestamp: number;
  filled: number;
  fromChain: ChainId;
  toChain: ChainId;
  symbol: string;
  amount: ethers.BigNumber;
  txHash: string;
}

// Will take a raw TX argument and transform into ViewModel.
export default function createTransactionModel(): Transaction[] {
  return [
    {
      timestamp: 1647025614,
      filled: 43,
      fromChain: 42161,
      toChain: 1,
      symbol: "UMA",
      amount: ethers.BigNumber.from("10"),
      txHash: "0x0000000000000000000000000000000000000000",
    },
    {
      timestamp: 1647020614,
      filled: 100,
      fromChain: 42161,
      toChain: 1,
      symbol: "UMA",
      amount: ethers.BigNumber.from("20"),
      txHash: "0x0000000000000000000000000000000000000000",
    },
    {
      timestamp: 1646020614,
      filled: 100,
      fromChain: 42161,
      toChain: 1,
      symbol: "UMA",
      amount: ethers.BigNumber.from("15"),
      txHash: "0x0000000000000000000000000000000000000000",
    },
  ];
}
