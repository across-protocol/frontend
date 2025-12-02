// Auto-generated file. Do not edit manually.
// Generated on 2025-11-24T15:39:04.833Z
// This file contains available liquidity sources for LiFi DEX integration

export const SOURCES = {
  strategy: "lifi",
  sources: {
    "1": [
      { key: "odos", names: ["odos"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "10": [
      { key: "odos", names: ["odos"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "56": [
      { key: "eisen", names: ["eisen"] },
      { key: "gluex", names: ["gluex"] },
      { key: "odos", names: ["odos"] },
      { key: "openocean", names: ["openocean"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "137": [
      { key: "odos", names: ["odos"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "143": [
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "oogaboogameta", names: ["oogaboogameta"] },
      { key: "monorail", names: ["monorail"] },
      { key: "kuru", names: ["kuru"] },
    ],
    "232": [{ key: "lifidexaggregator", names: ["lifidexaggregator"] }],
    "288": [
      { key: "lifidexaggregator", names: ["lifidexaggregator"] },
      { key: "sushiswap", names: ["sushiswap"] },
    ],
    "324": [
      { key: "odos", names: ["odos"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "480": [{ key: "lifidexaggregator", names: ["lifidexaggregator"] }],
    "999": [
      { key: "eisen", names: ["eisen"] },
      { key: "gluex", names: ["gluex"] },
      { key: "enso", names: ["enso"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "bebop", names: ["bebop"] },
      { key: "liquidswap", names: ["liquidswap"] },
      { key: "hyperbloom", names: ["hyperbloom"] },
      { key: "oogaboogameta", names: ["oogaboogameta"] },
      { key: "hyperflow", names: ["hyperflow"] },
    ],
    "1135": [{ key: "lifidexaggregator", names: ["lifidexaggregator"] }],
    "1868": [{ key: "eisen", names: ["eisen"] }],
    "8453": [
      { key: "eisen", names: ["eisen"] },
      { key: "odos", names: ["odos"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "9745": [
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
    ],
    "34443": [
      { key: "eisen", names: ["eisen"] },
      { key: "odos", names: ["odos"] },
      { key: "sushiswap", names: ["sushiswap"] },
    ],
    "42161": [
      { key: "eisen", names: ["eisen"] },
      { key: "odos", names: ["odos"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "57073": [
      { key: "lifidexaggregator", names: ["lifidexaggregator"] },
      { key: "superswap", names: ["superswap"] },
    ],
    "59144": [
      { key: "eisen", names: ["eisen"] },
      { key: "odos", names: ["odos"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "60808": [{ key: "lifidexaggregator", names: ["lifidexaggregator"] }],
    "81457": [
      { key: "eisen", names: ["eisen"] },
      { key: "kyberswap", names: ["kyberswap"] },
      { key: "sushiswap", names: ["sushiswap"] },
      { key: "okx", names: ["okx"] },
    ],
    "534352": [
      { key: "eisen", names: ["eisen"] },
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
  "bebop",
  "eisen",
  "enso",
  "gluex",
  "hyperbloom",
  "hyperflow",
  "kuru",
  "kyberswap",
  "lifidexaggregator",
  "liquidswap",
  "monorail",
  "odos",
  "okx",
  "oogaboogameta",
  "openocean",
  "superswap",
  "sushiswap",
] as const;
