import { ChainId } from "utils/constants";
import { ethers } from "ethers";
interface Transaction {
  timestamp: number;
  filled: number;
  fromChain: ChainId;
  toChain: ChainId;
  symbol: string;
  amount: ethers.BigNumber;
  txHash: string;
}

export default function createTransactionModel(): Transaction[] {
  return [
    {
      timestamp: 1647025614,
      filled: 43,
      fromChain: 1,
      toChain: 10,
      symbol: "UMA",
      amount: ethers.BigNumber.from("1000"),
      txHash: "0x12345",
    },
    {
      timestamp: 1647020614,
      filled: 100,
      fromChain: 1,
      toChain: 10,
      symbol: "UMA",
      amount: ethers.BigNumber.from("1000"),
      txHash: "0x12345",
    },
    {
      timestamp: 1646020614,
      filled: 100,
      fromChain: 1,
      toChain: 10,
      symbol: "UMA",
      amount: ethers.BigNumber.from("1000"),
      txHash: "0x12345",
    },
  ];
}
