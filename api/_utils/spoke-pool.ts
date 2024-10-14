import { utils } from "@across-protocol/sdk";

export const getSpokePoolAddress = (chainId: number): string => {
  switch (chainId) {
    default:
      return utils.getDeployedAddress("SpokePool", chainId) as string;
  }
};
