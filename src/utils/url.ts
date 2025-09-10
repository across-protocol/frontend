export function getBridgeUrlWithQueryParams({
  fromChainId,
  toChainId,
  inputTokenSymbol,
  outputTokenSymbol,
  externalProjectId,
}: {
  fromChainId: number;
  toChainId: number;
  inputTokenSymbol: string;
  outputTokenSymbol?: string;
  externalProjectId?: string;
}) {
  const cleanParams = Object.entries({
    from: fromChainId.toString(),
    to: toChainId.toString(),
    inputToken: inputTokenSymbol,
    outputToken: outputTokenSymbol,
    externalProjectId,
  }).reduce((acc, [key, value]) => {
    if (value) {
      return { ...acc, [key]: value };
    }
    return acc;
  }, {});
  return "/bridge?" + new URLSearchParams(cleanParams).toString();
}

export function buildSearchParams(
  params: Record<
    string,
    number | string | boolean | Array<number | string | boolean>
  >
): string {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((val) => searchParams.append(key, String(val)));
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}
