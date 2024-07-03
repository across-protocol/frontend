import { CHAIN_IDs } from "@across-protocol/constants";
import { TokenInfo, orderedTokenLogos } from "./tokens";

export type ExternalLPTokenList = Array<
  TokenInfo & {
    provider: string;
    linkToLP: string;
  }
>;

export const externalLPsForStaking: Record<number, ExternalLPTokenList> = {
  [CHAIN_IDs.MAINNET]: [
    {
      name: "Balancer 50wstETH-50ACX",
      symbol: "50wstETH-50ACX",
      displaySymbol: "50wstETH-50ACX",
      decimals: 18,
      mainnetAddress: "0x36Be1E97eA98AB43b4dEBf92742517266F5731a3",
      logoURI: orderedTokenLogos.BAL,
      provider: "balancer",
      linkToLP:
        "https://app.balancer.fi/#/ethereum/pool/0x36be1e97ea98ab43b4debf92742517266f5731a3000200000000000000000466",
      logoURIs: [
        orderedTokenLogos.ACX,
        "https://assets.coingecko.com/coins/images/18834/small/wstETH.png?1633565443",
      ],
    },
  ],
  [CHAIN_IDs.SEPOLIA]: [],
};
