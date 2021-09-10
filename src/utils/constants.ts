import { Initialization } from "bnc-onboard/dist/src/interfaces";

export const BREAKPOINTS = {
  tabletMin: 550,
  laptopMin: 1100,
  desktopMin: 1500,
};

export const QUERIES = {
  tabletAndUp: `(min-width: ${BREAKPOINTS.tabletMin / 16}rem)`,
  laptopAndUp: `(min-width: ${BREAKPOINTS.laptopMin / 16}rem)`,
  desktopAndUp: `(min-width: ${BREAKPOINTS.desktopMin / 16}rem)`,
  tabletAndDown: `(max-width: ${(BREAKPOINTS.laptopMin - 1) / 16}rem)`,
};

export const COLORS = {
  gray: "230deg 6% 19%",
  grayLight: "240deg 2% 39%",
  primary: "166deg 92% 70%",
  primaryDark: "180deg 15% 25%",
  secondary: "266deg 77% 62%",
  white: "0deg 100% 100%",
  black: "0deg 0% 0%",
  error: "11deg 92% 70%",
};

export const infuraId =
  process.env.REACT_APP_PUBLIC_INFURA_ID || "d5e29c9b9a9d4116a7348113f57770a8";

const getNetworkName = (chainId: number) => {
  switch (chainId) {
    case 1: {
      return "mainnet";
    }
    case 42: {
      return "kovan";
    }
    case 3: {
      return "ropsten";
    }
    case 4: {
      return "rinkeby";
    }
  }
};
export function onboardBaseConfig(_chainId?: number): Initialization {
  const chainId = _chainId ?? 1;
  const infuraRpc = `https://${getNetworkName(
    chainId
  )}.infura.io/v3/${infuraId}`;

  return {
    dappId: process.env.NEXT_PUBLIC_ONBOARD_API_KEY || "",
    hideBranding: true,
    networkId: 1, // Default to main net. If on a different network will change with the subscription.
    walletSelect: {
      wallets: [
        { walletName: "metamask", preferred: true },
        {
          walletName: "imToken",
          rpcUrl:
            chainId === 1
              ? "https://mainnet-eth.token.im"
              : "https://eth-testnet.tokenlon.im",
          preferred: true,
        },
        { walletName: "coinbase", preferred: true },
        {
          walletName: "portis",
          apiKey: process.env.NEXT_PUBLIC_PORTIS_API_KEY,
        },
        { walletName: "trust", rpcUrl: infuraRpc },
        { walletName: "dapper" },
        {
          walletName: "walletConnect",
          rpc: { [chainId || 1]: infuraRpc },
        },
        { walletName: "gnosis" },
        { walletName: "walletLink", rpcUrl: infuraRpc },
        { walletName: "opera" },
        { walletName: "operaTouch" },
        { walletName: "torus" },
        { walletName: "status" },
        { walletName: "unilogin" },
        {
          walletName: "ledger",
          rpcUrl: infuraRpc,
        },
      ],
    },
    walletCheck: [
      { checkName: "connect" },
      { checkName: "accounts" },
      { checkName: "network" },
      { checkName: "balance", minimumBalance: "0" },
    ],
    // To prevent providers from requesting block numbers every 4 seconds (see https://github.com/WalletConnect/walletconnect-monorepo/issues/357)
    blockPollingInterval: 1000 * 60 * 60,
  };
}
