import { NameResolver } from "./types";
import { ensResolver } from "./ens";
import { hyperliquidResolver } from "./hyperliquid";

const resolvers: NameResolver[] = [ensResolver, hyperliquidResolver];

export function getResolverForInput(input: string): NameResolver | undefined {
  return resolvers.find((resolver) => resolver.canResolve(input));
}

export function isResolvableName(input: string): boolean {
  return resolvers.some((resolver) => resolver.canResolve(input));
}

export { resolvers };
