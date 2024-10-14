import { relayFeeCalculator, utils, constants } from "@across-protocol/sdk";
import { BigNumberish } from "ethers";

import { maxRelayFeePct, relayerFeeCapitalCostConfig } from "../_constants";

import { getLogger } from "./logger";
import { getProvider } from "./providers";
import { getSpokePoolAddress } from "./spoke-pool";
import { getGasMarkup } from "./gas";

const { REACT_APP_COINGECKO_PRO_API_KEY } = process.env;

/**
 * Retrieves an isntance of the Across SDK RelayFeeCalculator
 * @param destinationChainId The destination chain that a bridge operation will transfer to
 * @returns An instance of the `RelayFeeCalculator` for the specific chain specified by `destinationChainId`
 */
export const getRelayerFeeCalculator = (
  destinationChainId: number,
  overrides: Partial<{
    spokePoolAddress: string;
    relayerAddress: string;
  }> = {}
) => {
  const queries = getRelayerFeeCalculatorQueries(destinationChainId, overrides);
  const relayerFeeCalculatorConfig = {
    feeLimitPercent: maxRelayFeePct * 100,
    queries,
    capitalCostsConfig: relayerFeeCapitalCostConfig,
  };
  if (relayerFeeCalculatorConfig.feeLimitPercent < 1)
    throw new Error(
      "Setting fee limit % < 1% will produce nonsensical relay fee details"
    );
  return new relayFeeCalculator.RelayFeeCalculator(
    relayerFeeCalculatorConfig,
    getLogger()
  );
};

export const getRelayerFeeCalculatorQueries = (
  destinationChainId: number,
  overrides: Partial<{
    spokePoolAddress: string;
    relayerAddress: string;
  }> = {}
) => {
  return relayFeeCalculator.QueryBase__factory.create(
    destinationChainId,
    getProvider(destinationChainId, { useSpeedProvider: true }),
    undefined,
    overrides.spokePoolAddress || getSpokePoolAddress(destinationChainId),
    overrides.relayerAddress,
    REACT_APP_COINGECKO_PRO_API_KEY,
    getLogger(),
    getGasMarkup(destinationChainId)
  );
};

export const buildDepositForSimulation = (depositArgs: {
  amount: BigNumberish;
  inputToken: string;
  outputToken: string;
  recipientAddress: string;
  originChainId: number;
  destinationChainId: number;
  message?: string;
}) => {
  const {
    amount,
    inputToken,
    outputToken,
    recipientAddress,
    originChainId,
    destinationChainId,
    message,
  } = depositArgs;
  // Small amount to simulate filling with. Should be low enough to guarantee a successful fill.
  const safeOutputAmount = utils.toBN(100);
  return {
    inputAmount: utils.toBN(amount),
    outputAmount: utils.isMessageEmpty(message)
      ? safeOutputAmount
      : utils.toBN(amount),
    depositId: utils.bnUint32Max.toNumber(),
    depositor: recipientAddress,
    recipient: recipientAddress,
    destinationChainId,
    originChainId,
    quoteTimestamp: utils.getCurrentTime() - 60, // Set the quote timestamp to 60 seconds ago ~ 1 ETH block
    inputToken,
    outputToken,
    fillDeadline: utils.bnUint32Max.toNumber(), // Defined as `INFINITE_FILL_DEADLINE` in SpokePool.sol
    exclusiveRelayer: constants.ZERO_ADDRESS,
    exclusivityDeadline: 0, // Defined as ZERO in SpokePool.sol
    message: message ?? constants.EMPTY_MESSAGE,
    fromLiteChain: false, // FIXME
    toLiteChain: false, // FIXME
  };
};
