import { ConverterFnType, useConnection } from "hooks";
import { useMutation } from "react-query";
import { BigNumber } from "ethers";

import {
  getConfig,
  hubPoolChainId,
  hubPoolAddress,
  waitOnTransaction,
} from "utils";
import { useIsWrongNetwork, useApprove, useStakingPool } from "hooks";

import { useUserLiquidityPool } from "./useUserLiquidityPool";
import { useLiquidityPool } from "./useLiquidityPool";
import { parseAndValidateAmountInput } from "../utils";

const config = getConfig();

export function useAddLiquidity(tokenSymbol?: string, l1TokenAddress?: string) {
  const { account, signer, notify } = useConnection();
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
          erc20Address: tokenInfo.l1TokenAddress,
          approvalAmount: parsedAndValidAmount,
          allowedContractAddress: hubPoolAddress,
        });
      }
    } catch (error) {
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
    await waitOnTransaction(hubPoolChainId, txResponse, notify);
  };

  return useMutation(handleAddLiquidity, {
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
  const { account, signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();

  const userLiquidityPoolQuery = useUserLiquidityPool(tokenSymbol);
  const stakingPoolQuery = useStakingPool(tokenAddress);
  const liquidityPoolQuery = useLiquidityPool(tokenSymbol);

  const handleRemoveLiquidity = async (args: {
    amountInput: string;
    maxRemovableAmount: BigNumber;
    convertUnderlyingToLP: ConverterFnType;
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

    const hubPoolContract = config.getHubPool(signer);
    const txResponse = await hubPoolContract.removeLiquidity(
      tokenInfo.l1TokenAddress,
      args.convertUnderlyingToLP(parsedAndValidAmount),
      isEth
    );
    await waitOnTransaction(hubPoolChainId, txResponse, notify);
  };

  return useMutation(handleRemoveLiquidity, {
    onSuccess: () => {
      userLiquidityPoolQuery.refetch();
      stakingPoolQuery.refetch();
      liquidityPoolQuery.refetch();
    },
  });
}
