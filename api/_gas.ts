import * as sdk from "@across-protocol/sdk";
import { BigNumber, BigNumberish } from "ethers";
import { getDefaultRecipientAddress } from "./_recipient-address";
import { getDefaultRelayerAddress } from "./_relayer-address";
import { CHAIN_IDs } from "./_constants";
import { AcrossErrorCode, InputError } from "./_errors";

export const DESTINATION_GAS_LIMITS_PER_CHAIN = {
  [CHAIN_IDs.HYPEREVM]: BigNumber.from(2_000_000),
};

export function assertDestinationGasBelowLimit(params: {
  destinationChainId: number;
  gasUnits: BigNumberish;
}) {
  const { destinationChainId, gasUnits } = params;

  const destinationGasLimit =
    DESTINATION_GAS_LIMITS_PER_CHAIN[destinationChainId];

  if (destinationGasLimit && BigNumber.from(gasUnits).gt(destinationGasLimit)) {
    throw new InputError({
      message: `Gas for destination chain ${destinationChainId} exceeds the limit of ${destinationGasLimit.toString()}`,
      code: AcrossErrorCode.SIMULATION_ERROR,
    });
  }
}

export function calcGasFeeDetails(params: {
  gasPriceEstimate: sdk.gasPriceOracle.GasPriceEstimate;
  nativeGasCost: BigNumberish;
  opStackL1GasCost?: BigNumberish;
}) {
  const { gasPriceEstimate, nativeGasCost, opStackL1GasCost } = params;

  const gasPriceEstimateEvm =
    gasPriceEstimate as sdk.gasPriceOracle.EvmGasPriceEstimate;
  const gasPriceEstimateSvm =
    gasPriceEstimate as sdk.gasPriceOracle.SvmGasPriceEstimate;

  // EVM-based chains
  if (
    gasPriceEstimateEvm.maxFeePerGas &&
    gasPriceEstimateEvm.maxPriorityFeePerGas
  ) {
    const tokenGasCost = BigNumber.from(nativeGasCost)
      .mul(gasPriceEstimateEvm.maxFeePerGas)
      .add(opStackL1GasCost ?? 0);
    return {
      tokenGasCost,
      opStackL1GasCost,
      gasPrice: gasPriceEstimateEvm.maxFeePerGas,
      nativeGasCost: BigNumber.from(nativeGasCost),
    };
  }

  // SVM-based chains
  if (
    gasPriceEstimateSvm.baseFee &&
    gasPriceEstimateSvm.microLamportsPerComputeUnit
  ) {
    const tokenGasCost = gasPriceEstimateSvm.baseFee.add(
      gasPriceEstimateSvm.microLamportsPerComputeUnit
        .mul(nativeGasCost)
        .div(1_000_000) // 1_000_000 microLamports/lamport.
    );
    return {
      tokenGasCost,
      opStackL1GasCost,
      gasPrice: tokenGasCost,
      nativeGasCost: BigNumber.from(nativeGasCost),
    };
  }

  throw new Error(
    "Can't compute gas fee details. Missing or incorrect gas price estimate."
  );
}

export function getDepositArgsForCachedGasDetails(
  originChainId: number,
  destinationChainId: number,
  tokenAddress: string
) {
  return {
    amount: BigNumber.from(100),
    inputToken: sdk.utils
      .toAddressType(sdk.constants.ZERO_ADDRESS, originChainId)
      .toBytes32(),
    outputToken: sdk.utils
      .toAddressType(tokenAddress, destinationChainId)
      .toBytes32(),
    recipientAddress: sdk.utils
      .toAddressType(
        getDefaultRecipientAddress(destinationChainId),
        destinationChainId
      )
      .toBytes32(),
    originChainId: originChainId,
    destinationChainId: destinationChainId,
    relayerAddress: sdk.utils
      .toAddressType(
        getDefaultRelayerAddress(destinationChainId),
        destinationChainId
      )
      .toBytes32(),
  };
}
