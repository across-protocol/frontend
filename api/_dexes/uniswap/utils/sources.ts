import { UNIVERSAL_ROUTER_02_ADDRESS } from "./addresses";

const SOURCE_NAMESPACE = "uniswap-api";

export const SOURCES = {
  strategy: "uniswap-api",
  sources: Object.keys(UNIVERSAL_ROUTER_02_ADDRESS).reduce(
    (acc, chainIdStr) => {
      const chainId = Number(chainIdStr);
      acc[chainId] = [
        {
          key: "V2",
          names: [
            SOURCE_NAMESPACE,
            `${SOURCE_NAMESPACE}/v2`,
            "uniswap_v2",
            "uniswap",
          ],
        },
        {
          key: "V3",
          names: [
            SOURCE_NAMESPACE,
            `${SOURCE_NAMESPACE}/v3`,
            "uniswap_v3",
            "uniswap",
          ],
        },
        {
          key: "V4",
          names: [
            SOURCE_NAMESPACE,
            `${SOURCE_NAMESPACE}/v4`,
            "uniswap_v4",
            "uniswap",
          ],
        },
      ];
      return acc;
    },
    {} as Record<number, { key: string; names: string[] }[]>
  ),
} as {
  strategy: string;
  sources: {
    [chainId: number]: {
      key: string; // Source key used by the DEX API
      names: string[]; // Source names that match the key
    }[];
  };
};

export const ALL_SOURCES = Array.from(
  new Set([
    ...Object.values(SOURCES.sources).flatMap((sources) =>
      sources.flatMap((source) => source.names)
    ),
  ])
);
