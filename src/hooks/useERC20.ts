import { clients } from "@uma/sdk";
import { ethers } from "ethers";
import { useCallback } from "react";

type ApproveArgs = {
  spender: string;
  amount: ethers.BigNumber;
  signer?: ethers.Signer;
};

type Approve = (
  args: ApproveArgs
) => Promise<ethers.ContractTransaction | undefined>;
export function useERC20(tokenAddress: string): { approve: Approve } {
  const approve = useCallback(
    async ({ spender, amount, signer }: ApproveArgs) => {
      if (!signer) {
        return;
      }
      const token = clients.erc20.connect(tokenAddress, signer);
      const tx = await token.approve(spender, amount);
      return tx;
    },
    [tokenAddress]
  );

  return { approve };
}
