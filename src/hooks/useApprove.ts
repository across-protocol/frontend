import { useConnection } from "hooks";
import { useMutation } from "react-query";
import { BigNumberish } from "ethers";
import { ERC20__factory } from "@across-protocol/contracts-v2";

import { MAX_APPROVAL_AMOUNT, notificationEmitter } from "utils";
import { useIsWrongNetwork } from "hooks";

export function useApprove() {
  const { account, signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();

  const handleApprove = async (args: {
    erc20Address: string;
    approvalAmount: BigNumberish;
    allowedContractAddress: string;
  }) => {
    if (!signer || !account) {
      return;
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    const erc20 = ERC20__factory.connect(args.erc20Address, signer);
    const allowance = await erc20.allowance(
      account,
      args.allowedContractAddress
    );

    if (allowance.lt(args.approvalAmount)) {
      const txResponse = await erc20.approve(
        args.allowedContractAddress,
        MAX_APPROVAL_AMOUNT
      );
      await notificationEmitter(txResponse.hash, notify);
    }
  };

  return useMutation(handleApprove);
}
