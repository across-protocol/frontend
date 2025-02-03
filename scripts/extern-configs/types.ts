// Destination only projects that are supported through a message bridge
// at a known supported intermediary chain
export type ExternalProjectConfig = {
  projectId: string;
  name: string;
  fullName?: string;
  explorer: string;
  publicRpcUrl: string;
  logoPath: string;
  grayscaleLogoPath: string;
  intermediaryChain: number;
  tokens: string[];
};
