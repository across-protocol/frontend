import { useQuery } from "@tanstack/react-query";
import { BigNumber, ethers } from "ethers";
import { bridgeFeesQueryKey, getBridgeFees, ChainId } from "utils";
import { AxiosError } from "axios";

/**
 * This hook calculates the bridge fees for a given token and amount.
 * @param amount - The amount to check bridge fees for.
 * @param fromChainId The chain Id of the origin chain
 * @param toChainId The chain Id of the receiving chain, its timestamp will be used to calculate the fees.
 * @param inputTokenSymbol - The input token symbol to check bridge fees for.
 * @param outputTokenSymbol - The output token symbol to check bridge fees for.
 * @returns The bridge fees for the given amount and token symbol and the UseQueryResult object.
 */
export function useBridgeFees(
  amount: ethers.BigNumber,
  fromChainId: ChainId,
  toChainId: ChainId,
  inputTokenSymbol: string,
  outputTokenSymbol: string,
  recipientAddress?: string
) {
  const queryKey = bridgeFeesQueryKey(
    amount,
    inputTokenSymbol,
    outputTokenSymbol,
    fromChainId,
    toChainId
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
      ] = queryKey;

      return getBridgeFees({
        amount: BigNumber.from(amountToQuery),
        inputTokenSymbol: inputTokenSymbolToQuery,
        outputTokenSymbol: outputTokenSymbolToQuery,
        toChainId: toChainIdToQuery,
        fromChainId: fromChainIdToQuery,
        recipientAddress,
      });
    },
    enabled: Boolean(amount.gt(0)),
    refetchInterval: 5000,
    retry: (_, error) => {
      if (
        error instanceof AxiosError &&
        error.response?.data.includes(
          "Amount exceeds max. deposit limit for short delay"
        )
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
