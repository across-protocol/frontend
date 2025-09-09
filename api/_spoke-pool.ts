import {
  SpokePool,
  SpokePool__factory,
} from "@across-protocol/contracts/dist/typechain";
import * as sdk from "@across-protocol/sdk";

import { getProvider, getSvmProvider } from "./_providers";
import { fetchState } from "@across-protocol/contracts/dist/src/svm/clients/SvmSpoke";
import { toSolanaKitAddress } from "./_address";

/**
 * Generates a relevant SpokePool given the input chain ID
 * @param _chainId A valid chain Id that corresponds to an available AcrossV2 Spoke Pool
 * @returns The corresponding SpokePool for the given `_chainId`
 */
export function getSpokePool(_chainId: number): SpokePool {
  const spokePoolAddress = getSpokePoolAddress(_chainId);
  return SpokePool__factory.connect(spokePoolAddress, getProvider(_chainId));
}

export async function getSvmSpokeState(
  chainId: number
): ReturnType<typeof fetchState> {
  const spokePoolAddress = getSpokePoolAddress(chainId);
  const address = sdk.utils.toAddressType(spokePoolAddress, chainId);
  const statePda = await sdk.arch.svm.getStatePda(toSolanaKitAddress(address));
  const svmProvider = getSvmProvider(chainId);
  const client = svmProvider.createRpcClient();

  const state = await fetchState(client, statePda);
  return state;
}

export function getSpokePoolAddress(chainId: number): string {
  if (sdk.utils.chainIsSvm(chainId)) {
    return sdk.utils.getDeployedAddress("SvmSpoke", chainId) as string;
  }
  switch (chainId) {
    default:
      return sdk.utils.getDeployedAddress("SpokePool", chainId) as string;
  }
}
