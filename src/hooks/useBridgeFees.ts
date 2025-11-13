import { useQuery } from "@tanstack/react-query";
import { BigNumber, ethers } from "ethers";
import {
  bridgeFeesQueryKey,
  getBridgeFees,
  ChainId,
  getBridgeFeesWithExternalProjectId,
  chainIsSvm,
} from "utils";
import { AxiosError } from "axios";
import { UniversalSwapQuote } from "./useUniversalSwapQuote";

const DEFAULT_SIMULATED_RECIPIENT_ADDRESS_EVM =
  "0xBb23Cd0210F878Ea4CcA50e9dC307fb0Ed65Cf6B";

const DEFAULT_SIMULATED_RECIPIENT_ADDRESS_SVM =
  "GsiZqCTNRi4T3qZrixFdmhXVeA4CSUzS7c44EQ7Rw1Tw";

/**
 * This hook calculates the bridge fees for a given token and amount.
 * @param amount - The amount to check bridge fees for.
 * @param fromChainId The chain Id of the origin chain
 * @param toChainId The chain Id of the receiving chain, its timestamp will be used to calculate the fees.
 * @param inputTokenSymbol - The input token symbol to check bridge fees for.
 * @param outputTokenSymbol - The output token symbol to check bridge fees for.
 * @param externalProjectId - The external project id to check bridge fees for.
 * @param recipientAddress - The recipient address to check bridge fees for.
 * @returns The bridge fees for the given amount and token symbol and the UseQueryResult object.
 */
export function useBridgeFees(
  amount: ethers.BigNumber,
  fromChainId: ChainId,
  toChainId: ChainId,
  inputTokenSymbol: string,
  outputTokenSymbol: string,
  externalProjectId?: string,
  _recipientAddress?: string,
  isUniversalSwap?: boolean,
  universalSwapQuote?: UniversalSwapQuote,
  enabled: boolean = true
) {
  const didUniversalSwapLoad = isUniversalSwap && !!universalSwapQuote;
  const bridgeInputTokenSymbol = didUniversalSwapLoad
    ? universalSwapQuote.steps.bridge.tokenIn.symbol
    : inputTokenSymbol;
  const bridgeOutputTokenSymbol = didUniversalSwapLoad
    ? universalSwapQuote.steps.bridge.tokenOut.symbol
    : outputTokenSymbol;
  const recipientAddress =
    _recipientAddress ??
    (chainIsSvm(toChainId)
      ? DEFAULT_SIMULATED_RECIPIENT_ADDRESS_SVM
      : DEFAULT_SIMULATED_RECIPIENT_ADDRESS_EVM);

  const queryKey = bridgeFeesQueryKey(
    amount,
    bridgeInputTokenSymbol,
    bridgeOutputTokenSymbol,
    fromChainId,
    toChainId,
    externalProjectId,
    recipientAddress
  );
  const { data: fees, ...delegated } = useQuery({
    queryKey,
    queryFn: ({ queryKey }) => {
      const [
        ,
        inputTokenSymbolToQuery,
        outputTokenSymbolToQuery,
        amountToQuery,
        fromChainIdToQuery,
        toChainIdToQuery,
        externalProjectIdToQuery,
        recipientAddressToQuery,
      ] = queryKey;

      const feeArgs = {
        amount: BigNumber.from(amountToQuery),
        inputTokenSymbol: inputTokenSymbolToQuery,
        outputTokenSymbol: outputTokenSymbolToQuery,
        toChainId: toChainIdToQuery,
        fromChainId: fromChainIdToQuery,
        recipientAddress: recipientAddressToQuery,
      };

      return externalProjectIdToQuery
        ? getBridgeFeesWithExternalProjectId(externalProjectIdToQuery, feeArgs)
        : getBridgeFees(feeArgs);
    },
    enabled: enabled && Boolean(amount.gt(0)),
    refetchInterval: 5000,
    retry: (_, error) => {
      if (
        error instanceof AxiosError &&
        (error.response?.data?.message?.includes(
          "doesn't have enough funds to support this deposit"
        ) ||
          error.response?.data?.message?.includes(
            "Amount exceeds max. deposit limit for short delay"
          ))
      ) {
        return false;
      }
      return true;
    },
  });
  return {
    fees,
    ...delegated,
  };
}
