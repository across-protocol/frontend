import ethLogo from "assets/token-logos/eth.svg";
import maticLogo from "assets/token-logos/matic.svg";
import usdcLogo from "assets/token-logos/usdc.svg";
import usdtLogo from "assets/token-logos/usdt.svg";
import daiLogo from "assets/token-logos/dai.svg";
import wbtcLogo from "assets/token-logos/wbtc.svg";
import balLogo from "assets/token-logos/bal.svg";
import optimismLogo from "assets/token-logos/op.svg";
import wethLogo from "assets/token-logos/weth.svg";
import arbitrumLogo from "assets/token-logos/arb.svg";
import bobaLogo from "assets/token-logos/boba.svg";
import umaLogo from "assets/token-logos/uma.svg";
import acxLogo from "assets/token-logos/acx.svg";
import snxLogo from "assets/token-logos/snx.svg";
import pooltogetherLogo from "assets/token-logos/pool.svg";
import lskLogo from "assets/token-logos/lsk.svg";
import usdbLogo from "assets/token-logos/usdb.svg";
import ghoLogo from "assets/token-logos/gho.svg";
import unknownLogo from "assets/icons/question-circle.svg";

import { BRIDGED_USDC_SYMBOLS } from "../utils/sdk";

export type TokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  logoURIs?: [string, string];
  // tokens require a mainnet address to do price lookups on coingecko, not used for anything else.
  mainnetAddress?: string;
  // optional display symbol for tokens that have a different symbol on the frontend
  displaySymbol?: string;
  addresses?: Record<number, string>;
};
export type TokenInfoList = TokenInfo[];

const equivalentTokens = [BRIDGED_USDC_SYMBOLS, ["DAI", "USDB"]];

const similarTokens = [
  ["USDC", ...BRIDGED_USDC_SYMBOLS],
  ["ETH", "WETH"],
];

export const interchangeableTokensMap: Record<string, string[]> =
  equivalentTokens.reduce(
    (acc, tokens) => {
      tokens.forEach((token) => {
        acc[token] = tokens.filter((t) => t !== token);
      });
      return acc;
    },
    {} as Record<string, string[]>
  );

export const similarTokensMap: Record<string, string[]> = similarTokens.reduce(
  (acc, tokens) => {
    tokens.forEach((token) => {
      acc[token] = tokens.filter((t) => t !== token);
    });
    return acc;
  },
  {} as Record<string, string[]>
);

// Order of this map determines the order of the tokens in the token selector
export const orderedTokenLogos = {
  ETH: ethLogo,
  WETH: wethLogo,
  MATIC: maticLogo,
  WMATIC: maticLogo,
  USDC: usdcLogo,
  "USDC.e": usdcLogo,
  USDbC: usdcLogo,
  USDzC: usdcLogo,
  USDT: usdtLogo,
  DAI: daiLogo,
  USDB: usdbLogo,
  WBTC: wbtcLogo,
  BAL: balLogo,
  UMA: umaLogo,
  ACX: acxLogo,
  SNX: snxLogo,
  POOL: pooltogetherLogo,
  BOBA: bobaLogo,
  OP: optimismLogo,
  ARB: arbitrumLogo,
  LSK: lskLogo,
  GRASS: unknownLogo,
  WGRASS: unknownLogo,
  XYZ: unknownLogo,
  GHO: ghoLogo,
  WGHO: ghoLogo,
  "TATARA-USDC": usdcLogo,
  "TATARA-USDS": unknownLogo,
  "TATARA-USDT": usdtLogo,
  "TATARA-WBTC": wbtcLogo,
};
