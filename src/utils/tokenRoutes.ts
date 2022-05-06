import assert from "assert";
import {
  getProvider,
  ChainId,
  GetEventType,
  Provider,
  Event,
  isSupportedChainId,
} from "utils";
import {
  ERC20__factory,
  HubPool,
  HubPool__factory,
  SpokePool,
  SpokePool__factory,
} from "@across-protocol/contracts-v2";

// event types
type L1TokenEnabledForLiquidityProvision = GetEventType<
  HubPool,
  "L1TokenEnabledForLiquidityProvision"
>;
type L2TokenDisabledForLiquidityProvision = GetEventType<
  HubPool,
  "L2TokenDisabledForLiquidityProvision"
>;
type SetEnableDepositRoute = GetEventType<HubPool, "SetEnableDepositRoute">;
type CrossChainContractsSet = GetEventType<HubPool, "CrossChainContractsSet">;
type EnabledDepositRoute = GetEventType<SpokePool, "EnabledDepositRoute">;

type HubPoolEvent =
  | L1TokenEnabledForLiquidityProvision
  | L2TokenDisabledForLiquidityProvision
  | SetEnableDepositRoute
  | CrossChainContractsSet;
type SpokePoolEvent = EnabledDepositRoute;

// return object
export interface Route {
  fromChain: number;
  toChain: number;
  tokenAddress: string;
  spokeAddress: string;
  symbol: string;
  isNative: boolean;
}
export type Routes = Route[];

// type the hub pool events
export function isSetEnableDepositRoute(
  event: Event
): event is SetEnableDepositRoute {
  return event.event === "SetEnableDepositRoute";
}
export function isCrossChainContractsSet(
  event: Event
): event is CrossChainContractsSet {
  return event.event === "CrossChainContractsSet";
}
export function isL1TokenEnabledForLiquidityProvision(
  event: Event
): event is L1TokenEnabledForLiquidityProvision {
  return event.event === "L1TokenEnabledForLiquidityProvision";
}
export function isL2TokenDisabledForLiquidityProvision(
  event: Event
): event is L2TokenDisabledForLiquidityProvision {
  return event.event === "L2TokenDisabledForLiquidityProvision";
}

// type the spoke pool events
export function isEnabledDepositRoute(
  event: Event
): event is EnabledDepositRoute {
  return event.event === "EnabledDepositRoute";
}

export class SpokePoolUtils {
  public readonly contract: SpokePool;
  private events: SpokePoolEvent[] = [];
  public wrappedNativeToken: string | void = undefined;
  constructor(
    public readonly address: string,
    public readonly provider: Provider
  ) {
    this.contract = SpokePool__factory.connect(address, provider);
  }
  async update() {
    await this.fetchEvents();
    try {
      this.wrappedNativeToken = await this.contract.wrappedNativeToken();
    } catch {
      this.wrappedNativeToken = "0x4200000000000000000000000000000000000006";
    }
  }
  async fetchEvents(): Promise<Array<SpokePoolEvent>> {
    const queries = [
      this.contract.queryFilter(this.contract.filters.EnabledDepositRoute()),
    ];
    this.events = (await Promise.all(queries)).flat();
    return this.events;
  }
  routesEnabled(): Record<string, string[]> {
    const init: Record<string, Set<string>> = {};
    const result = this.events.reduce((result, event) => {
      if (!isEnabledDepositRoute(event)) return result;
      const { destinationChainId, originToken, enabled } = event.args;
      if (!result[destinationChainId.toString()])
        result[destinationChainId.toString()] = new Set();
      if (enabled) {
        result[destinationChainId.toString()].add(originToken);
      } else {
        result[destinationChainId.toString()].delete(originToken);
      }
      return result;
    }, init);

    return Object.fromEntries(
      Object.entries(result).map(([chainId, addressSet]) => {
        return [chainId, [...addressSet.values()]];
      })
    );
  }
  getSupportedTokens(): string[] {
    const table = this.routesEnabled();
    const tokens = new Set<string>();
    Object.values(table).forEach((value) => {
      Object.values(value).forEach((token) => tokens.add(token));
    });
    return [...tokens.values()];
  }
  getSupportedChains(): number[] {
    const table = this.routesEnabled();
    return [...Object.keys(table)].map(Number);
  }
}

export class HubPoolUtils {
  public readonly contract: HubPool;
  private events: HubPoolEvent[] = [];
  constructor(private address: string, private provider: Provider) {
    this.contract = HubPool__factory.connect(address, provider);
  }
  async fetchEvents(): Promise<HubPoolEvent[]> {
    const queries = [
      this.contract.queryFilter(
        this.contract.filters.L1TokenEnabledForLiquidityProvision()
      ),
      this.contract.queryFilter(
        this.contract.filters.L2TokenDisabledForLiquidityProvision()
      ),
      this.contract.queryFilter(this.contract.filters.SetEnableDepositRoute()),
      this.contract.queryFilter(this.contract.filters.CrossChainContractsSet()),
    ];
    this.events = (await Promise.all(queries)).flat().sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
      if (a.transactionIndex !== b.transactionIndex)
        return a.transactionIndex - b.transactionIndex;
      if (a.logIndex !== b.logIndex) return a.logIndex - b.logIndex;
      throw new Error(
        "Duplicate events found on transaction: " + a.transactionHash
      );
    });
    return this.events;
  }
  getSpokePoolAddresses(): Record<number, string> {
    const init: Record<number, string> = {};
    return this.events.reduce((result, event) => {
      if (!isCrossChainContractsSet(event)) return result;
      result[event.args.l2ChainId.toNumber()] = event.args.spokePool;
      return result;
    }, init);
  }
  getL1LpTokenTable(): Record<string, string> {
    const init: Record<string, string> = {};
    return this.events.reduce((result, event) => {
      if (isL1TokenEnabledForLiquidityProvision(event)) {
        result[event.args.l1Token] = event.args.lpToken;
      }
      if (isL2TokenDisabledForLiquidityProvision(event)) {
        delete result[event.args.l1Token];
      }
      return result;
    }, init);
  }
  getL1Tokens(): string[] {
    return [...Object.keys(this.getL1LpTokenTable())];
  }
  getLpTokens(): string[] {
    return [...Object.values(this.getL1LpTokenTable())];
  }
  getRoutes(): Record<number, Record<number, Record<string, boolean>>> {
    const result: Record<number, Record<number, Record<string, boolean>>> = {};
    this.events.forEach((event) => {
      if (!isSetEnableDepositRoute(event)) return;
      const {
        destinationChainId,
        originChainId,
        originToken,
        depositsEnabled,
      } = event.args;
      if (!result[originChainId]) result[originChainId] = {};
      if (!result[originChainId][destinationChainId])
        result[originChainId][destinationChainId] = {};
      result[originChainId][destinationChainId][originToken] = depositsEnabled;
    });
    return result;
  }
}

// fetch info we need for all routes
async function getSpokePoolState(spoke: SpokePoolUtils): Promise<{
  routes: ReturnType<SpokePoolUtils["routesEnabled"]>;
  symbols: Record<string, string>;
  wrappedNativeToken: string;
}> {
  await spoke.update();
  const routes = spoke.routesEnabled();
  const supportedTokens = spoke.getSupportedTokens();
  const { wrappedNativeToken } = spoke;
  assert(wrappedNativeToken, "Spoke pool missing wrapped native token address");
  const symbols = Object.fromEntries(
    await Promise.all(
      supportedTokens.map(async (tokenAddress) => {
        const contract = ERC20__factory.connect(tokenAddress, spoke.provider);
        return [tokenAddress, await contract.symbol()];
      })
    )
  );

  return {
    routes,
    symbols,
    wrappedNativeToken,
  };
}

interface RouteConfig {
  hubPoolAddress: string;
  hubPoolChain: number;
  routes: Routes;
  wrappedNativeTokens: Record<number, string>;
}

// main function to return route list
export async function fetchRoutes(
  hubPoolChain: ChainId,
  hubPoolAddress: string
): Promise<RouteConfig> {
  const provider = getProvider(hubPoolChain);
  const hubPool = new HubPoolUtils(hubPoolAddress, provider);
  await hubPool.fetchEvents();
  const spokePoolAddresses = await hubPool.getSpokePoolAddresses();

  const allRoutes: Routes = [];
  const wrappedNativeTokens: Record<number, string> = {};
  for (const [fromChain, spokeAddress] of Object.entries(spokePoolAddresses)) {
    assert(
      isSupportedChainId(Number(fromChain)),
      "Missing supported chain id: " + fromChain
    );
    const provider = getProvider(Number(fromChain));
    const pool = new SpokePoolUtils(spokeAddress, provider);
    const { routes, symbols, wrappedNativeToken } = await getSpokePoolState(
      pool
    );
    wrappedNativeTokens[Number(fromChain)] = wrappedNativeToken;
    Object.entries(routes).forEach(([toChain, tokenAddresses]) => {
      tokenAddresses.forEach((tokenAddress) => {
        const symbol = symbols[tokenAddress];
        allRoutes.push({
          tokenAddress,
          spokeAddress,
          fromChain: Number(fromChain),
          toChain: Number(toChain),
          symbol,
          isNative: false,
        });
      });
    });
  }
  return {
    hubPoolChain,
    hubPoolAddress,
    routes: allRoutes,
    wrappedNativeTokens,
  };
}
