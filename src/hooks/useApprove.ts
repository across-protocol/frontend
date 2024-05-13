import { useConnection } from "hooks";
import { useMutation } from "react-query";
import { BigNumberish } from "ethers";

import {
  hubPoolChainId,
  MAX_APPROVAL_AMOUNT,
  waitOnTransaction,
  getConfig,
} from "utils";
import { ERC20__factory } from "utils/typechain";
import { useIsWrongNetwork } from "hooks";

const config = getConfig();

export function useApprove(requiredChainId = hubPoolChainId) {
  const { account, signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } =
    useIsWrongNetwork(requiredChainId);

  const handleApprove = async (args: {
    erc20Symbol: string;
    approvalAmount: BigNumberish;
    allowedContractAddress: string;
    enforceCorrectNetwork?: boolean;
  }) => {
    if (!signer || !account) {
      return;
    }

    if (isWrongNetwork) {
      if (args.enforceCorrectNetwork) {
        await isWrongNetworkHandler();
      } else {
        return;
      }
    }

    const tokenInfo = config.getTokenInfoBySymbol(
      requiredChainId,
      args.erc20Symbol
    );

    const erc20 = ERC20__factory.connect(tokenInfo.address, signer);
    const allowance = await erc20.allowance(
      account,
      args.allowedContractAddress
    );

    if (allowance.gte(args.approvalAmount)) {
      return;
    }

    if (allowance.gt(0) && tokenInfo.symbol === "USDT") {
      // USDT has a different approval flow when changing an already approve amount.
      // We need to set the allowance to 0 first.
      // See https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7#code#L201
      const zeroAmountApprovalTx = await erc20.approve(
        args.allowedContractAddress,
        0
      );
      await waitOnTransaction(requiredChainId, zeroAmountApprovalTx, notify);
    }

    const txResponse = await erc20.approve(
      args.allowedContractAddress,
      MAX_APPROVAL_AMOUNT
    );
    await waitOnTransaction(requiredChainId, txResponse, notify);
  };

  return useMutation(handleApprove);
}
