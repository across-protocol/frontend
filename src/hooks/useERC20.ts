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

type AllowanceArgs = {
  account: string;
  spender: string;
  provider: ethers.Signer | ethers.providers.Provider;
};

type Allowance = (args: AllowanceArgs) => Promise<ethers.BigNumber>;

export function useERC20(tokenAddress: string): {
  approve: Approve;
  allowance: Allowance;
} {
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

  const allowance = useCallback(
    async ({ spender, account, provider }: AllowanceArgs) => {
      const token = clients.erc20.connect(tokenAddress, provider);
      return token.allowance(account, spender);
    },
    [tokenAddress]
  );

  return { approve, allowance };
}
