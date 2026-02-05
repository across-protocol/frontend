import { useQuery } from "@tanstack/react-query";
import { nameResolverQueryKey } from "utils/query-keys";
import { getResolverForInput } from "./resolvers";
import { UseNameResolverResult } from "./types";

export function useNameResolver(
  input: string | undefined
): UseNameResolverResult {
  const trimmedInput = input?.trim().toLowerCase();
  const resolver = trimmedInput ? getResolverForInput(trimmedInput) : undefined;
  const isName = !!resolver;

  const { data, isLoading, error } = useQuery({
    queryKey: nameResolverQueryKey(trimmedInput),
    queryFn: async () => {
      if (!trimmedInput || !resolver) {
        return null;
      }
      return resolver.resolve(trimmedInput);
    },
    enabled: isName,
    staleTime: Infinity,
    retry: 2,
  });

  return {
    resolvedAddress: data ?? undefined,
    isLoading: isName && isLoading,
    isName,
    error: error as Error | null,
    nameService: resolver?.suffix.slice(1),
  };
}
