// Auto-generated file. Do not edit manually.
// Generated on 2025-09-29T08:09:29.301Z
// This file contains available liquidity sources for LiFi DEX integration

export const SOURCES = {
  strategy: "lifi",
  sources: {
    "1": [
      { key: "enso", names: ["enso"] },
      { key: "odos", names: ["odos"] },
      { key: "1inch", names: ["1inch"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
      { key: "merkle", names: ["merkle"] },
    ],
    "10": [
      { key: "paraswap", names: ["paraswap"] },
      { key: "odos", names: ["odos"] },
      { key: "1inch", names: ["1inch"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "56": [
      { key: "dodo", names: ["dodo"] },
      { key: "odos", names: ["odos"] },
      { key: "1inch", names: ["1inch"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "lifidexaggregator", names: ["lifidexaggregator"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "130": [
      { key: "paraswap", names: ["paraswap"] },
      { key: "enso", names: ["enso"] },
      { key: "lifidexaggregator", names: ["lifidexaggregator"] },
    ],
    "137": [
      { key: "paraswap", names: ["paraswap"] },
      { key: "odos", names: ["odos"] },
      { key: "1inch", names: ["1inch"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "232": [{ key: "lifidexaggregator", names: ["lifidexaggregator"] }],
    "288": [
      { key: "lifidexaggregator", names: ["lifidexaggregator"] },
      { key: "sushiswap", names: ["sushiswap"] },
    ],
    "324": [
      { key: "odos", names: ["odos"] },
      { key: "1inch", names: ["1inch"] },
      { key: "openocean", names: ["openocean"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "480": [{ key: "lifidexaggregator", names: ["lifidexaggregator"] }],
    "999": [
      { key: "enso", names: ["enso"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "bebop", names: ["bebop"] },
      { key: "liquidswap", names: ["liquidswap"] },
      { key: "hyperbloom", names: ["hyperbloom"] },
      { key: "oogaboogameta", names: ["oogaboogameta"] },
      { key: "hyperflow", names: ["hyperflow"] },
    ],
    "1135": [{ key: "lifidexaggregator", names: ["lifidexaggregator"] }],
    "1868": [
      { key: "enso", names: ["enso"] },
      { key: "lifidexaggregator", names: ["lifidexaggregator"] },
    ],
    "8453": [
      { key: "enso", names: ["enso"] },
      { key: "odos", names: ["odos"] },
      { key: "1inch", names: ["1inch"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "9745": [{ key: "kyberswap", names: ["kyberswap"] }],
    "34443": [
      { key: "odos", names: ["odos"] },
      { key: "openocean", names: ["openocean"] },
      { key: "lifidexaggregator", names: ["lifidexaggregator"] },
      { key: "sushiswap", names: ["sushiswap"] },
    ],
    "42161": [
      { key: "enso", names: ["enso"] },
      { key: "odos", names: ["odos"] },
      { key: "1inch", names: ["1inch"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "57073": [
      { key: "enso", names: ["enso"] },
      { key: "lifidexaggregator", names: ["lifidexaggregator"] },
      { key: "superswap", names: ["superswap"] },
    ],
    "59144": [
      { key: "odos", names: ["odos"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "60808": [{ key: "lifidexaggregator", names: ["lifidexaggregator"] }],
    "81457": [
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "534352": [
      { key: "odos", names: ["odos"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
  },
} as {
  strategy: string;
  sources: {
    [chainId: number]: {
      key: string; // Source key used by the DEX API
      names: string[]; // Source names that match the key
    }[];
  };
};

export const ALL_SOURCES = [
  "1inch",
  "bebop",
  "dodo",
  "enso",
  "hyperbloom",
  "hyperflow",
  "kyberswap",
  "lifidexaggregator",
  "liquidswap",
  "merkle",
  "odos",
  "okx",
  "oogaboogameta",
  "openocean",
  "paraswap",
  "superswap",
  "sushiswap",
] as const;
