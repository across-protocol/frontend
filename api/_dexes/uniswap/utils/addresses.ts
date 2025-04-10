import { CHAIN_IDs } from "@across-protocol/constants";

// Taken from here: https://docs.uniswap.org/contracts/v3/reference/deployments/
export const SWAP_ROUTER_02_ADDRESS = {
  [CHAIN_IDs.ARBITRUM]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.BASE]: "0x2626664c2603336E57B271c5C0b26F421741e481",
  [CHAIN_IDs.BLAST]: "0x549FEB8c9bd4c12Ad2AB27022dA12492aC452B66",
  [CHAIN_IDs.LENS]: "0x6ddD32cd941041D8b61df213B9f515A7D288Dc13",
  [CHAIN_IDs.MAINNET]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.OPTIMISM]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.POLYGON]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.WORLD_CHAIN]: "0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6",
  [CHAIN_IDs.ZK_SYNC]: "0x99c56385daBCE3E81d8499d0b8d0257aBC07E8A3",
  [CHAIN_IDs.ZORA]: "0x7De04c96BE5159c3b5CeffC82aa176dc81281557",
};

export const POOL_FACTORY_CONTRACT_ADDRESS = {
  [CHAIN_IDs.ARBITRUM]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  [CHAIN_IDs.BASE]: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  [CHAIN_IDs.BLAST]: "0x792edAdE80af5fC680d96a2eD80A44247D2Cf6Fd",
  [CHAIN_IDs.LENS]: "0xe0704DB90bcAA1eAFc00E958FF815Ab7aa11Ef47",
  [CHAIN_IDs.MAINNET]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  [CHAIN_IDs.OPTIMISM]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  [CHAIN_IDs.POLYGON]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  [CHAIN_IDs.WORLD_CHAIN]: "0x7a5028BDa40e7B173C278C5342087826455ea25a",
  [CHAIN_IDs.ZK_SYNC]: "0x8FdA5a7a8dCA67BBcDd10F02Fa0649A937215422",
  [CHAIN_IDs.ZORA]: "0x7145F8aeef1f6510E92164038E1B6F8cB2c42Cbb",
};

export const QUOTER_CONTRACT_ADDRESS = {
  [CHAIN_IDs.ARBITRUM]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  [CHAIN_IDs.BASE]: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
  [CHAIN_IDs.BLAST]: "0x6Cdcd65e03c1CEc3730AeeCd45bc140D57A25C77",
  [CHAIN_IDs.LENS]: "0x1eEA2B790Dc527c5a4cd3d4f3ae8A2DDB65B2af1",
  [CHAIN_IDs.MAINNET]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  [CHAIN_IDs.OPTIMISM]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  [CHAIN_IDs.POLYGON]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  [CHAIN_IDs.WORLD_CHAIN]: "0x10158D43e6cc414deE1Bd1eB0EfC6a5cBCfF244c",
  [CHAIN_IDs.ZK_SYNC]: "0x8Cb537fc92E26d8EBBb760E632c95484b6Ea3e28",
  [CHAIN_IDs.ZORA]: "0x11867e1b3348F3ce4FcC170BC5af3d23E07E64Df",
};

// Hardcoded LP addresses
export const POOL_ADDRESS = {
  [CHAIN_IDs.LENS]: {
    USDC_WGHO: "0x5eB6b146D7A5322b763C8f8B0Eb2FDd5d15E49De",
    WETH_WGHO: "0xdf4b8153bf91f54802a9ba16366b2111724384e4",
    USDC_WETH: "0x6b6eb6f437bf54d22b997c3b38b79a23bc63f39f",
  },
};
