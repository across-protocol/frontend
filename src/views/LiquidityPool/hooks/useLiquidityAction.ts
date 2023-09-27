import { useConnection } from "hooks";
import { useMutation } from "react-query";
import { BigNumber } from "ethers";

import {
  getConfig,
  hubPoolChainId,
  hubPoolAddress,
  waitOnTransaction,
  fixedPointAdjustment,
  AcrossDepositArgs,
  abiEncodeAddress,
} from "utils";
import { useIsWrongNetwork, useApprove, useStakingPool } from "hooks";

import { useUserLiquidityPool } from "./useUserLiquidityPool";
import { useLiquidityPool } from "./useLiquidityPool";
import { parseAndValidateAmountInput } from "../utils";
import { useBridge } from "views/Bridge/hooks/useBridge";
import { useTransferQuote } from "views/Bridge/hooks/useTransferQuote";
import { useBridgeAction } from "views/Bridge/hooks/useBridgeAction";

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

export function useAddAndBridge(
  fromChain: number,
  selectedRoute: {
    l1TokenAddress: string;
    fromChain: number;
    toChain: number;
    fromTokenAddress: string;
    fromSpokeAddress: string;
    fromTokenSymbol: string;
    isNative: boolean;
  },
  amount: string,
  tokenDecimals: number,
  tokenSymbol: string,
  tokenAddress: string,
  isNative: boolean
) {
  const { account } = useConnection();

  let parsedAmount: BigNumber;
  try {
    parsedAmount = parseAndValidateAmountInput(
      amount,
      tokenDecimals,
      BigNumber.from(10).pow(100)
    );
  } catch {
    parsedAmount = BigNumber.from(0);
  }

  // Replace with real address.
  const toAddress = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

  const {
    estimatedTime,
    quote,
    initialQuoteTime,
    quotedFees,
    quotedLimits,
    quotePriceUSD,
    isQuoteLoading,
  } = useTransferQuote(selectedRoute, parsedAmount, account, toAddress);

  // export type AcrossDepositArgs = {
  //   fromChain: ChainId;
  //   toChain: ChainId;
  //   toAddress: string;
  //   amount: ethers.BigNumber;
  //   tokenAddress: string;
  //   relayerFeePct: ethers.BigNumber;
  //   timestamp: ethers.BigNumber;
  //   message?: string;
  //   maxCount?: ethers.BigNumber;
  //   referrer?: string;
  //   isNative: boolean;
  // };

  const depositArgs: AcrossDepositArgs = {
    fromChain: selectedRoute.fromChain,
    toChain: 1,
    toAddress: toAddress,
    amount: parsedAmount,
    tokenAddress: selectedRoute.fromTokenAddress,
    relayerFeePct: quotedFees?.relayerFee?.pct || BigNumber.from(0),
    timestamp:
      initialQuoteTime === undefined
        ? BigNumber.from(Math.round(Date.now() / 1000))
        : BigNumber.from(initialQuoteTime),
    message: account ? abiEncodeAddress(account) : "0x1234",
    isNative: isNative,
  };

  const bridgeActionOutput = useBridgeAction(
    isQuoteLoading,
    depositArgs,
    tokenSymbol,
    () => {},
    () => {},
    quote,
    initialQuoteTime,
    quotePriceUSD
  );

  // const handleBridgeAndAddLiquidity = async (args: {
  //   amountInput: string;
  //   maxRemovableAmount: BigNumber;
  //   maxRemovableAmountInLP: BigNumber;
  // }) => {
  //   if (!tokenSymbol || !signer || !account) {
  //     return;
  //   }

  //   if (isWrongNetwork) {
  //     await isWrongNetworkHandler();
  //   }

  //   const isEth = tokenSymbol === "ETH";
  //   const tokenInfo = config.getTokenInfoBySymbol(hubPoolChainId, tokenSymbol);
  //   const parsedAndValidAmount = parseAndValidateAmountInput(
  //     args.amountInput,
  //     tokenInfo.decimals,
  //     args.maxRemovableAmount
  //   );

  //   // ratio (amount to remove / max removable amount) denominated in underlying tokens
  //   const ratio = parsedAndValidAmount
  //     .mul(fixedPointAdjustment)
  //     .div(args.maxRemovableAmount);
  //   const amountToRemoveInLP = ratio
  //     .mul(args.maxRemovableAmountInLP)
  //     .div(fixedPointAdjustment);

  //   const hubPoolContract = config.getHubPool(signer);
  //   const txResponse = await hubPoolContract.removeLiquidity(
  //     tokenInfo.l1TokenAddress,
  //     amountToRemoveInLP,
  //     isEth
  //   );
  //   await waitOnTransaction(hubPoolChainId, txResponse, notify);
  // };

  return bridgeActionOutput.buttonActionMutationResult;

  // return useMutation(, {
  //   onSuccess: () => {
  //     userLiquidityPoolQuery.refetch();
  //     stakingPoolQuery.refetch();
  //     liquidityPoolQuery.refetch();
  //   },
  // });
}
