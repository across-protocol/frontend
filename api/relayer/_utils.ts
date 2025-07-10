export function getBaseCurrency(token: string): string | null {
  if (token === "USDC" || token === "USDT") {
    return "usd";
  } else if (token === "WETH") {
    return "eth";
  }
  return null;
}
