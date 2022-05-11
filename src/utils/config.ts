import assert from "assert";
import { Signer } from "./ethers";
import * as constants from "./constants";
import {
  HubPool,
  HubPool__factory,
  SpokePool,
  SpokePool__factory,
} from "@across-protocol/contracts-v2";
import filter from "lodash/filter";

export type Token = constants.TokenInfo & {
  l1TokenAddress: string;
  address: string;
  isNative: boolean;
};
export type TokenList = Token[];

export class ConfigClient {
  public readonly spokeAddresses: Record<number, string> = {};
  public readonly spokeChains: Set<number> = new Set();
  public readonly fromChains: Set<number> = new Set();
  public readonly toChains: Set<number> = new Set();
  constructor(private config: constants.RouteConfig) {
    this.config.routes.forEach((route) => {
      this.spokeAddresses[route.fromChain] = route.fromSpokeAddress;
      this.spokeChains.add(route.fromChain);
      this.spokeChains.add(route.toChain);
      this.toChains.add(route.toChain);
      this.fromChains.add(route.fromChain);
    });
  }
  getWethAddress(): string {
    return this.config.hubPoolWethAddress;
  }
  getRoutes(): constants.Routes {
    return this.config.routes;
  }
  getSpokePoolAddress(chainId: constants.ChainId): string {
    const address = this.spokeAddresses[chainId];
    assert(address, "Spoke pool not supported on chain: " + chainId);
    return address;
  }
  getSpokePool(chainId: constants.ChainId, signer?: Signer): SpokePool {
    const address = this.getSpokePoolAddress(chainId);
    const provider = signer ?? constants.getProvider(chainId);
    return SpokePool__factory.connect(address, provider);
  }
  getHubPoolChainId(): constants.ChainId {
    return this.config.hubPoolChain;
  }
  getHubPoolAddress(): string {
    return this.config.hubPoolAddress;
  }
  getL1TokenAddressBySymbol(symbol: string) {
    // all routes have an l1Token address, so just find the first symbol that matches
    const route = this.config.routes.find((x) => x.fromTokenSymbol === symbol);
    assert(route, `Unsupported l1 address lookup by symbol: ${symbol}`);
    return route.l1TokenAddress;
  }
  getHubPool(signer?: Signer): HubPool {
    const address = this.getHubPoolAddress();
    const provider = signer ?? constants.getProvider(this.getHubPoolChainId());
    return HubPool__factory.connect(address, provider);
  }
  filterRoutes(query: Partial<constants.Route>): constants.Routes {
    const cleanQuery: Partial<constants.Route> = Object.fromEntries(
      Object.entries(query).filter((entry) => {
        return entry[1] !== undefined;
      })
    );
    return filter(this.config.routes, cleanQuery);
  }
  listToChains(): constants.ChainInfoList {
    const result: constants.ChainInfoList = [];
    constants.chainInfoList.forEach((chain) => {
      if (this.toChains.has(chain.chainId)) {
        result.push(chain);
      }
    });
    return result;
  }
  listFromChains(): constants.ChainInfoList {
    const result: constants.ChainInfoList = [];
    constants.chainInfoList.forEach((chain) => {
      if (this.fromChains.has(chain.chainId)) {
        result.push(chain);
      }
    });
    return result;
  }
  // this maintains order specified in the constants file in the chainInfoList
  getSpokeChains(): constants.ChainInfoList {
    const result: constants.ChainInfoList = [];
    constants.chainInfoList.forEach((chain) => {
      if (this.spokeChains.has(chain.chainId)) {
        result.push(chain);
      }
    });
    return result;
  }
  getSpokeChainIds(): constants.ChainId[] {
    return this.getSpokeChains()
      .map((chain) => chain.chainId)
      .filter(constants.isSupportedChainId);
  }
  isSupportedChainId(chainId: number): boolean {
    return (
      constants.isSupportedChainId(chainId) && this.spokeChains.has(chainId)
    );
  }
  // returns token list in order specified by constants, but adds in token address for the chain specified
  getTokenList(chainId?: number): TokenList {
    const routeTable = Object.fromEntries(
      this.filterRoutes({ fromChain: chainId }).map((route) => {
        return [route.fromTokenSymbol, route];
      })
    );
    return constants.tokenList
      .filter((token: constants.TokenInfo) => routeTable[token.symbol])
      .map((token: constants.TokenInfo) => {
        const { fromTokenAddress, isNative, l1TokenAddress } =
          routeTable[token.symbol];
        return {
          ...token,
          address: fromTokenAddress,
          isNative,
          l1TokenAddress,
        };
      });
  }
  getTokenInfoByAddress(chainId: number, address: string): Token {
    const tokens = this.getTokenList(chainId);
    const token = tokens.find((token) => token.address === address);
    assert(
      token,
      `Token not found on chain: ${chainId} and address ${address}`
    );
    return token;
  }
  getTokenInfoBySymbol(chainId: number, symbol: string): Token {
    const tokens = this.getTokenList(chainId);
    const token = tokens.find((token) => token.symbol === symbol);
    assert(token, `Token not found on chain ${chainId} and symbol ${symbol}`);
    const tokenInfo = constants.getToken(symbol);
    return {
      ...tokenInfo,
      address: token.address,
      isNative: token.isNative,
      l1TokenAddress: token.l1TokenAddress,
    };
  }
  getNativeTokenInfo(chainId: number): constants.TokenInfo {
    const chainInfo = constants.getChainInfo(chainId);
    return constants.getToken(chainInfo.nativeCurrencySymbol);
  }
  canBridge(fromChain: number, toChain: number): boolean {
    const routes = this.filterRoutes({ fromChain, toChain });
    return routes.length > 0;
  }
  filterReachableTokens(fromChain: number, toChain?: number): TokenList {
    const routes = this.filterRoutes({ fromChain, toChain });
    return routes.map((route) =>
      this.getTokenInfoBySymbol(fromChain, route.fromTokenSymbol)
    );
  }
}

// singleton
let config: ConfigClient | undefined;
export function getConfig(): ConfigClient {
  if (config) return config;
  config = new ConfigClient(constants.routeConfig);
  return config;
}
