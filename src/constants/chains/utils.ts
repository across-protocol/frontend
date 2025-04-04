export const vercelApiBaseUrl =
  process.env.REACT_APP_VERCEL_API_BASE_URL_OVERRIDE || "";

export function getProxyRpcUrl(chainId: number): string {
  return `${vercelApiBaseUrl}/api/rpc-proxy?chainId=${chainId}`;
}
