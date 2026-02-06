import { useConnection } from "hooks/useConnection";
import { useIsWrongNetwork } from "hooks/useIsWrongNetwork";
import { useApprove } from "hooks/useApprove";
import { useStakingPool } from "hooks/useStakingPool";
import { useMutation } from "@tanstack/react-query";
import { BigNumber } from "ethers";

import {
  hubPoolChainId,
  hubPoolAddress,
  fixedPointAdjustment,
} from "utils/constants";
import { waitOnTransaction } from "utils/notify";
import { getConfig } from "utils/config";

import { useUserLiquidityPool } from "./useUserLiquidityPool";
import { useLiquidityPool } from "./useLiquidityPool";
import { parseAndValidateAmountInput } from "../utils";

const config = getConfig();

export function useAddLiquidity(tokenSymbol?: string, l1TokenAddress?: string) {
  const { account, signer } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();

  const userLiquidityPoolQuery = useUserLiquidityPool(tokenSymbol);
  const stakingPoolQuery = useStakingPool(l1TokenAddress);
  const liquidityPoolQuery = useLiquidityPool(tokenSymbol);

  const { mutateAsync: approve } = useApprove();

  const handleAddLiquidity = async (args: {
    amountInput: string;
    maxAddableAmount: BigNumber;
  }) => {
    if (!tokenSymbol || !signer || !account) {
      return;
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    const isEth = tokenSymbol === "ETH";
    const tokenInfo = config.getTokenInfoBySymbol(hubPoolChainId, tokenSymbol);
    const parsedAndValidAmount = parseAndValidateAmountInput(
      args.amountInput,
      tokenInfo.decimals,
      args.maxAddableAmount
    );

    try {
      if (!isEth) {
        await approve({
          erc20Symbol: tokenSymbol,
          approvalAmount: parsedAndValidAmount,
          allowedContractAddress: hubPoolAddress,
        });
      }
    } catch (error) {
      console.error(error);
      return;
    }

    const hubPoolContract = config.getHubPool(signer);
    const txResponse = await hubPoolContract.addLiquidity(
      tokenInfo.l1TokenAddress,
      parsedAndValidAmount,
      {
        value: isEth ? parsedAndValidAmount : undefined,
      }
    );
    await waitOnTransaction(hubPoolChainId, txResponse);
  };

  return useMutation({
    mutationFn: handleAddLiquidity,
    onSuccess: () => {
      userLiquidityPoolQuery.refetch();
      stakingPoolQuery.refetch();
      liquidityPoolQuery.refetch();
    },
  });
}

export function useRemoveLiquidity(
  tokenSymbol?: string,
  tokenAddress?: string
) {
  const { account, signer } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();

  const userLiquidityPoolQuery = useUserLiquidityPool(tokenSymbol);
  const stakingPoolQuery = useStakingPool(tokenAddress);
  const liquidityPoolQuery = useLiquidityPool(tokenSymbol);

  const handleRemoveLiquidity = async (args: {
    amountInput: string;
    maxRemovableAmount: BigNumber;
    maxRemovableAmountInLP: BigNumber;
  }) => {
    if (!tokenSymbol || !signer || !account) {
      return;
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    const isEth = tokenSymbol === "ETH";
    const tokenInfo = config.getTokenInfoBySymbol(hubPoolChainId, tokenSymbol);
    const parsedAndValidAmount = parseAndValidateAmountInput(
      args.amountInput,
      tokenInfo.decimals,
      args.maxRemovableAmount
    );

    // ratio (amount to remove / max removable amount) denominated in underlying tokens
    const ratio = parsedAndValidAmount
      .mul(fixedPointAdjustment)
      .div(args.maxRemovableAmount);
    const amountToRemoveInLP = ratio
      .mul(args.maxRemovableAmountInLP)
      .div(fixedPointAdjustment);

    const hubPoolContract = config.getHubPool(signer);
    const txResponse = await hubPoolContract.removeLiquidity(
      tokenInfo.l1TokenAddress,
      amountToRemoveInLP,
      isEth
    );
    await waitOnTransaction(hubPoolChainId, txResponse);
  };

  return useMutation({
    mutationFn: handleRemoveLiquidity,
    onSuccess: () => {
      userLiquidityPoolQuery.refetch();
      stakingPoolQuery.refetch();
      liquidityPoolQuery.refetch();
    },
  });
}
