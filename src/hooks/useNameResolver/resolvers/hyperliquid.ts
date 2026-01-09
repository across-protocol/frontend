import { NameResolver } from "./types";

const HYPERLIQUID_NAMES_API_URL = "https://api.hlnames.xyz/resolve/address";
const HYPERLIQUID_NAMES_API_KEY = "CPEPKMI-HUSUX6I-SE2DHEA-YYWFG5Y";

export const hyperliquidResolver: NameResolver = {
  suffix: ".hl",

  canResolve(input: string): boolean {
    return input.toLowerCase().endsWith(".hl");
  },

  async resolve(name: string): Promise<string | null> {
    const response = await fetch(`${HYPERLIQUID_NAMES_API_URL}/${name}`, {
      headers: {
        "X-API-Key": HYPERLIQUID_NAMES_API_KEY,
      },
    }).then((res) => res.json());

    return response?.address ?? null;
  },
};
