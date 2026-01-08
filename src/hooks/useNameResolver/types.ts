export type UseNameResolverResult = {
  resolvedAddress: string | undefined;
  isLoading: boolean;
  isName: boolean;
  error: Error | null;
  nameService: string | undefined;
};
