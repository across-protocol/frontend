import { PROVIDERS, ChainId, GetEventType, Provider } from "utils";
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
  hubPoolAddress: string;
  hubPoolChain: number;
  fromChain: number;
  toChain: number;
  tokenAddress: string;
  spokeAddress: string;
  symbol: string;
}
export type Routes = Route[];

export class SpokePoolUtils {
  private contract: SpokePool;
  private events: SpokePoolEvent[] = [];
  constructor(
    public readonly address: string,
    public readonly provider: Provider
  ) {
    this.contract = SpokePool__factory.connect(address, provider);
  }
  async fetchEvents(): Promise<Array<SpokePoolEvent>> {
    const queries = [
      this.contract.queryFilter(
        (this.contract.filters as any).EnabledDepositRoute()
      ),
    ];
    this.events = (await Promise.all(queries)).flat();
    return this.events;
  }
  routesEnabled(): Record<string, string[]> {
    const init: Record<string, Set<string>> = {};
    const result = this.events.reduce((result, event) => {
      if (event.event !== "EnabledDepositRoute") return result;
      const typedEvent = event as EnabledDepositRoute;
      const { destinationChainId, originToken, enabled } = typedEvent.args;
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
  private contract: HubPool;
  private events: HubPoolEvent[] = [];
  constructor(private address: string, private provider: Provider) {
    this.contract = HubPool__factory.connect(address, provider);
  }
  async fetchEvents(): Promise<HubPoolEvent[]> {
    const queries = [
      this.contract.queryFilter(
        (this.contract.filters as any).L1TokenEnabledForLiquidityProvision()
      ),
      this.contract.queryFilter(
        (this.contract.filters as any).L2TokenDisabledForLiquidityProvision()
      ),
      this.contract.queryFilter(
        (this.contract.filters as any).SetEnableDepositRoute()
      ),
      this.contract.queryFilter(
        (this.contract.filters as any).CrossChainContractsSet()
      ),
    ];
    this.events = (await Promise.all(queries)).flat().sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
      if (a.transactionIndex !== b.transactionIndex)
        return a.transactionIndex - b.transactionIndex;
      if (a.logIndex !== b.logIndex) return a.logIndex - b.logIndex;
      // if everything is the same, return a, ie maintain order of array
      return -1;
    });
    return this.events;
  }
  getSpokePoolAddresses(): Record<number, string> {
    const init: Record<number, string> = {};
    return this.events.reduce((result, event) => {
      if (event.event !== "CrossChainContractsSet") return result;
      const typedEvent = event as CrossChainContractsSet;
      result[typedEvent.args.l2ChainId.toNumber()] = typedEvent.args.spokePool;
      return result;
    }, init);
  }
  getL1LpTokenTable(): Record<string, string> {
    const init: Record<string, string> = {};
    return this.events.reduce((result, event) => {
      switch (event.event) {
        case "L1TokenEnabledForLiquidityProvision": {
          const typedEvent = event as L1TokenEnabledForLiquidityProvision;
          result[typedEvent.args.l1Token] = typedEvent.args.lpToken;
          break;
        }
        case "L2TokenDisabledForLiquidityProvision": {
          const typedEvent = event as L2TokenDisabledForLiquidityProvision;
          delete result[typedEvent.args.l1Token];
          break;
        }
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
      if (event.event !== "SetEnableDepositRoute") return;
      const typedEvent = event as SetEnableDepositRoute;
      const {
        destinationChainId,
        originChainId,
        originToken,
        depositsEnabled,
      } = typedEvent.args;
      if (!result[originChainId]) result[originChainId] = {};
      if (!result[originChainId][destinationChainId])
        result[originChainId][destinationChainId] = {};
      result[originChainId][destinationChainId][originToken] = depositsEnabled;
    });
    return result;
  }
}

// fetch info we need for all routes
async function getSpokePoolState(
  spoke: SpokePoolUtils
): Promise<{
  routes: ReturnType<SpokePoolUtils["routesEnabled"]>;
  symbols: Record<string, string>;
}> {
  await spoke.fetchEvents();
  const routes = spoke.routesEnabled();
  const supportedTokens = spoke.getSupportedTokens();
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
  };
}

// main function to return route list
export async function fetchRoutes(
  hubPoolChain: ChainId,
  hubPoolAddress: string
): Promise<Routes> {
  const provider = PROVIDERS[hubPoolChain]();
  const hubPool = new HubPoolUtils(hubPoolAddress, provider);
  await hubPool.fetchEvents();
  const spokePoolAddresses = await hubPool.getSpokePoolAddresses();

  const allRoutes: Routes = [];
  for (const [fromChain, spokeAddress] of Object.entries(spokePoolAddresses)) {
    const provider = PROVIDERS[Number(fromChain) as ChainId]();
    const pool = new SpokePoolUtils(spokeAddress, provider);
    const { routes, symbols } = await getSpokePoolState(pool);
    Object.entries(routes).forEach(([toChain, tokenAddresses]) => {
      tokenAddresses.forEach((tokenAddress) => {
        const symbol = symbols[tokenAddress];
        allRoutes.push({
          tokenAddress,
          spokeAddress,
          fromChain: Number(fromChain),
          toChain: Number(toChain),
          symbol,
          hubPoolAddress,
          hubPoolChain: Number(hubPoolChain),
        });
      });
    });
  }
  return allRoutes;
}
