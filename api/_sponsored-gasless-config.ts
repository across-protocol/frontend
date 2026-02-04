import { CHAIN_IDs } from "./_constants";
import { Permission } from "./_api-keys";

export type SponsoredGaslessRouteConfig = {
  name: string;
  permission: Permission;
  allowedOriginChains: number[];
  allowedDestinationChains: number[];
  allowedInputTokenSymbols: string[];
  allowedOutputTokenSymbols: string[];
  exclusiveRelayer: string;
  permitTypes: string[];
  exclusivityDeadline?: number;
};

export const SPONSORED_GASLESS_ROUTES: SponsoredGaslessRouteConfig[] = [
  {
    name: "coinbase",
    permission: "sponsored-gasless",
    allowedOriginChains: [
      CHAIN_IDs.MAINNET,
      CHAIN_IDs.ARBITRUM,
      CHAIN_IDs.BASE,
      CHAIN_IDs.OPTIMISM,
      CHAIN_IDs.POLYGON,
    ],
    allowedDestinationChains: [
      CHAIN_IDs.MAINNET,
      CHAIN_IDs.ARBITRUM,
      CHAIN_IDs.BASE,
      CHAIN_IDs.OPTIMISM,
      CHAIN_IDs.POLYGON,
    ],
    allowedInputTokenSymbols: ["USDC"],
    allowedOutputTokenSymbols: ["USDC"],
    permitTypes: ["erc3009"],
    // TODO: set correct values
    exclusiveRelayer: "0x0000000000000000000000000000000000000000",
    exclusivityDeadline: 0,
  },
  {
    name: "local-dev",
    permission: "sponsored-gasless",
    allowedOriginChains: [
      CHAIN_IDs.MAINNET,
      CHAIN_IDs.ARBITRUM,
      CHAIN_IDs.BASE,
      CHAIN_IDs.OPTIMISM,
      CHAIN_IDs.POLYGON,
    ],
    allowedDestinationChains: [
      CHAIN_IDs.MAINNET,
      CHAIN_IDs.ARBITRUM,
      CHAIN_IDs.BASE,
      CHAIN_IDs.OPTIMISM,
      CHAIN_IDs.POLYGON,
    ],
    allowedInputTokenSymbols: ["USDC"],
    allowedOutputTokenSymbols: ["USDC"],
    permitTypes: ["erc3009"],
    exclusiveRelayer: "0x0000000000000000000000000000000000000000",
    exclusivityDeadline: 0,
  },
];

export function getSponsoredGaslessRoute(params: {
  apiKeyName?: string;
  apiKeyPermissions?: Permission[];
  originChainId: number;
  destinationChainId: number;
  inputTokenSymbol: string;
  outputTokenSymbol: string;
  permitType: string;
}): SponsoredGaslessRouteConfig | undefined {
  const {
    apiKeyName,
    apiKeyPermissions,
    originChainId,
    destinationChainId,
    inputTokenSymbol,
    outputTokenSymbol,
    permitType,
  } = params;

  if (!apiKeyName || !apiKeyPermissions) {
    return undefined;
  }

  return SPONSORED_GASLESS_ROUTES.find((config) => {
    const hasConfig = config.name.toLowerCase() === apiKeyName.toLowerCase();
    const hasPermission = apiKeyPermissions.includes(config.permission);
    const isAllowedOriginChain =
      config.allowedOriginChains.includes(originChainId);
    const isAllowedDestinationChain =
      config.allowedDestinationChains.includes(destinationChainId);
    const isAllowedInputToken =
      config.allowedInputTokenSymbols.includes(inputTokenSymbol);
    const isAllowedOutputToken =
      config.allowedOutputTokenSymbols.includes(outputTokenSymbol);

    return (
      hasConfig &&
      hasPermission &&
      isAllowedOriginChain &&
      isAllowedDestinationChain &&
      isAllowedInputToken &&
      isAllowedOutputToken &&
      config.permitTypes.includes(permitType)
    );
  });
}
