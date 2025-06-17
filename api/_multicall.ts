import * as sdk from "@across-protocol/sdk";
import { Multicall3 } from "@balancer-labs/sdk";
import { BigNumber, ethers, providers, Signer } from "ethers";

import { MINIMAL_MULTICALL3_ABI } from "./_abis";
import { MULTICALL3_ADDRESS, MULTICALL3_ADDRESS_OVERRIDES } from "./_constants";

export function getMulticall3(
  chainId: number,
  signerOrProvider?: Signer | providers.Provider
): Multicall3 | undefined {
  const address = getMulticall3Address(chainId);

  // no multicall on this chain
  if (!address) {
    return undefined;
  }

  return new ethers.Contract(
    address,
    MINIMAL_MULTICALL3_ABI,
    signerOrProvider
  ) as Multicall3;
}

export function getMulticall3Address(chainId: number): string | undefined {
  const addressOverride = MULTICALL3_ADDRESS_OVERRIDES[chainId];
  const addressFromSdk = sdk.utils.getMulticallAddress(chainId);

  if (addressOverride) {
    return addressOverride;
  }

  return addressFromSdk;
}

/**
 * Makes a series of read calls via multicall3 (so they only hit the provider once).
 * @param provider Provider to use for the calls.
 * @param calls the calls to make via multicall3. Each call includes a contract, function name, and args, so that
 * this function can encode them correctly.
 * @param overrides Overrides to use for the multicall3 call.
 * @returns An array of the decoded results in the same order that they were passed in.
 */
export async function callViaMulticall3(
  provider: ethers.providers.JsonRpcProvider,
  calls: {
    contract: ethers.Contract;
    functionName: string;
    args?: any[];
  }[],
  overrides: ethers.CallOverrides = {}
): Promise<ethers.utils.Result[]> {
  const chainId = (await provider.getNetwork()).chainId;
  const multicall3 = new ethers.Contract(
    getMulticall3Address(chainId) ?? MULTICALL3_ADDRESS,
    MINIMAL_MULTICALL3_ABI,
    provider
  );
  const inputs = calls.map(({ contract, functionName, args }) => ({
    target: contract.address,
    callData: contract.interface.encodeFunctionData(functionName, args),
  }));
  const [, results] = await (multicall3.callStatic.aggregate(
    inputs,
    overrides
  ) as Promise<[BigNumber, string[]]>);
  return results.map((result, i) =>
    calls[i].contract.interface.decodeFunctionResult(
      calls[i].functionName,
      result
    )
  );
}
