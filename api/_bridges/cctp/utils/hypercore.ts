import { BigNumber, ethers } from "ethers";
import { CrossSwapQuotes } from "../../../_dexes/types";
import { tagIntegratorId, tagSwapApiMarker } from "../../../_integrator-id";
import { InvalidParamError } from "../../../_errors";
import { CHAIN_IDs } from "../../../_constants";
import { Token } from "../../../_dexes/types";
import { ConvertDecimals } from "../../../_utils";
import { accountExistsOnHyperCore } from "../../../_hypercore";

const HYPERCORE_ACCOUNT_CREATION_FEE_USDC = 1;

const CORE_WALLET_ADDRESSES = {
  // Currently deployed only on HyperEVM Testnet
  [CHAIN_IDs.HYPEREVM_TESTNET]: "0x0B80659a4076E9E93C7DbE0f10675A16a3e5C206",
};

// Entrypoint contract on HyperEVM for depositing USDC to Hypercore via CCTP.
const CORE_DEPOSIT_WALLET_ABI = [
  "function depositWithAuth(uint256 amount, uint256 authValidAfter, uint256 authValidBefore, bytes32 authNonce, uint8 v, bytes32 r, bytes32 s)",
  "function depositFor(address recipient, uint256 amount)",
  "function deposit(uint256 amount)",
];

export function isToHyperCore(destinationChainId: number) {
  return [CHAIN_IDs.HYPERCORE, CHAIN_IDs.HYPERCORE_TESTNET].includes(
    destinationChainId
  );
}

export async function getAmountToHyperCore(params: {
  inputToken: Token;
  outputToken: Token;
  inputOrOutput: "input" | "output";
  amount: BigNumber;
  recipient?: string;
}) {
  const { inputToken, outputToken, inputOrOutput, amount, recipient } = params;

  if (!recipient) {
    throw new InvalidParamError({
      message: "CCTP: Recipient is not provided",
      param: "recipient",
    });
  }

  const recipientExists = await accountExistsOnHyperCore({
    account: recipient,
    chainId: inputToken.chainId,
  });

  if (recipientExists) {
    return inputOrOutput === "input"
      ? ConvertDecimals(inputToken.decimals, outputToken.decimals)(amount) // return output amount
      : ConvertDecimals(outputToken.decimals, inputToken.decimals)(amount); // return input amount
  }

  // If recipient does not exist on HyperCore, consider 1 USDC account creation fee
  const accountCreationFee = ethers.utils.parseUnits(
    HYPERCORE_ACCOUNT_CREATION_FEE_USDC.toString(),
    inputOrOutput === "input" ? inputToken.decimals : outputToken.decimals
  );

  // If provided amount is `inputAmount`, subtract account creation fee and return required output amount
  if (inputOrOutput === "input") {
    const outputAmount = amount.sub(accountCreationFee);
    if (outputAmount.lte(0)) {
      throw new InvalidParamError({
        message: "CCTP: Amount must exceed account creation fee",
        param: "amount",
      });
    }
    return ConvertDecimals(
      inputToken.decimals,
      outputToken.decimals
    )(outputAmount);
  }

  // If provided amount is `outputAmount`, add account creation fee and return required input amount
  return ConvertDecimals(
    outputToken.decimals,
    inputToken.decimals
  )(amount.add(accountCreationFee));
}

export function isHyperEvmToHyperCoreRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  // Mainnet or testnet route
  return (
    (params.inputToken.chainId === CHAIN_IDs.HYPEREVM &&
      params.outputToken.chainId === CHAIN_IDs.HYPERCORE) ||
    (params.inputToken.chainId === CHAIN_IDs.HYPEREVM_TESTNET &&
      params.outputToken.chainId === CHAIN_IDs.HYPERCORE_TESTNET)
  );
}

export function buildCctpTxHyperEvmToHyperCore(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
}) {
  const { bridgeQuote, crossSwap } = params.quotes;

  if (
    !isHyperEvmToHyperCoreRoute({
      inputToken: crossSwap.inputToken,
      outputToken: crossSwap.outputToken,
    })
  ) {
    throw new InvalidParamError({
      message: "Invalid route specified for HyperEVM -> HyperCore via CCTP",
      param: "inputToken, outputToken",
    });
  }

  const coreWalletAddress = CORE_WALLET_ADDRESSES[crossSwap.inputToken.chainId];

  if (!coreWalletAddress) {
    throw new InvalidParamError({
      message: `CoreWallet address not found for chain ${crossSwap.inputToken.chainId}`,
      param: "inputToken.chainId",
    });
  }

  const iface = new ethers.utils.Interface(CORE_DEPOSIT_WALLET_ABI);

  const callData = iface.encodeFunctionData("depositFor", [
    crossSwap.recipient,
    bridgeQuote.inputAmount,
  ]);

  const callDataWithIntegratorId = params.integratorId
    ? tagIntegratorId(params.integratorId, callData)
    : callData;
  const callDataWithSwapApiMarker = tagSwapApiMarker(callDataWithIntegratorId);

  return {
    chainId: crossSwap.inputToken.chainId,
    from: crossSwap.depositor,
    to: coreWalletAddress,
    data: callDataWithSwapApiMarker,
    value: BigNumber.from(0),
    ecosystem: "evm" as const,
  };
}
