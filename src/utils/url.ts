export function getBridgeUrlWithQueryParams({
  fromChainId,
  toChainId,
  inputTokenSymbol,
  outputTokenSymbol,
}: {
  fromChainId: number;
  toChainId: number;
  inputTokenSymbol: string;
  outputTokenSymbol?: string;
}) {
  const cleanParams = Object.entries({
    from: fromChainId.toString(),
    to: toChainId.toString(),
    inputToken: inputTokenSymbol,
    outputToken: outputTokenSymbol,
  }).reduce((acc, [key, value]) => {
    if (value) {
      return { ...acc, [key]: value };
    }
    return acc;
  }, {});
  return "/bridge?" + new URLSearchParams(cleanParams).toString();
}
