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

const EMPTY_BRIDGE_FEES = {
  totalRelayFee: {
    total: BigNumber.from(0),
    pct: BigNumber.from(0),
  },
  lpFee: {
    total: BigNumber.from(0),
    pct: BigNumber.from(0),
  },
  relayerGasFee: {
    total: BigNumber.from(0),
    pct: BigNumber.from(0),
  },
  relayerCapitalFee: {
    total: BigNumber.from(0),
    pct: BigNumber.from(0),
  },
  quoteTimestamp: BigNumber.from(0),
  quoteTimestampInMs: BigNumber.from(0),
  quoteLatency: BigNumber.from(0),
  quoteBlock: BigNumber.from(0),
  limits: {
    maxDepositInstant: BigNumber.from(ethers.constants.MaxUint256),
    maxDeposit: BigNumber.from(ethers.constants.MaxUint256),
    maxDepositShortDelay: BigNumber.from(ethers.constants.MaxUint256),
    minDeposit: BigNumber.from(0),
    recommendedDepositInstant: BigNumber.from(ethers.constants.MaxUint256),
  },
  estimatedFillTimeSec: 1,
  exclusiveRelayer: ethers.constants.AddressZero,
  exclusivityDeadline: 0,
  fillDeadline: 0,
  isAmountTooLow: false,
};

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
  universalSwapQuote?: UniversalSwapQuote
) {
  const didUniversalSwapLoad = isUniversalSwap && !!universalSwapQuote;
  const bridgeInputTokenSymbol = didUniversalSwapLoad
    ? universalSwapQuote.steps.bridge.tokenIn.symbol
    : inputTokenSymbol;
  const bridgeOutputTokenSymbol = didUniversalSwapLoad
    ? universalSwapQuote.steps.bridge.tokenOut.symbol
    : outputTokenSymbol;
  const bridgeOriginChainId = didUniversalSwapLoad
    ? universalSwapQuote.steps.bridge.tokenIn.chainId
    : fromChainId;
  const bridgeDestinationChainId = didUniversalSwapLoad
    ? universalSwapQuote.steps.bridge.tokenOut.chainId
    : toChainId;
  const recipientAddress =
    _recipientAddress ??
    (chainIsSvm(toChainId)
      ? DEFAULT_SIMULATED_RECIPIENT_ADDRESS_SVM
      : DEFAULT_SIMULATED_RECIPIENT_ADDRESS_EVM);

  const queryKey = bridgeFeesQueryKey(
    amount,
    bridgeInputTokenSymbol,
    bridgeOutputTokenSymbol,
    bridgeOriginChainId,
    bridgeDestinationChainId,
    didUniversalSwapLoad ? universalSwapQuote.steps.bridge.provider : "across",
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
        bridgeProviderToQuery,
        externalProjectIdToQuery,
        recipientAddressToQuery,
      ] = queryKey;

      if (bridgeProviderToQuery === "hypercore") {
        return EMPTY_BRIDGE_FEES;
      }

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
    enabled: Boolean(amount.gt(0)),
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
