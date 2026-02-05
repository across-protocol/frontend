import { getProvider } from "utils/providers";
import { ChainId } from "utils/constants";
import { NameResolver } from "./types";

export const ensResolver: NameResolver = {
  suffix: ".eth",

  canResolve(input: string): boolean {
    return input.toLowerCase().endsWith(".eth");
  },

  async resolve(name: string): Promise<string | null> {
    const provider = getProvider(ChainId.MAINNET);
    return provider.resolveName(name);
  },
};
