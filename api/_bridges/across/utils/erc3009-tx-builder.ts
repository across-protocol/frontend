import { utils } from "ethers";

import { getReceiveWithAuthTypedData } from "../../../_transfer-with-auth";
import {
  getSpokePoolPeriphery,
  TransferType,
} from "../../../_spoke-pool-periphery";
import {
  extractDepositDataStruct,
  extractSwapAndDepositDataStruct,
} from "../../../_dexes/utils";
import { getSpokePoolAddress } from "../../../_utils";

import type {
  CrossSwapQuotes,
  DepositEntryPointContract,
  OriginSwapEntryPointContract,
} from "../../../_dexes/types";
import type { GaslessTx, Witness } from "../../types";

export async function buildErc3009Tx(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string | undefined;
  validAfter: number;
  validBefore: number;
}): Promise<GaslessTx> {
  const { quotes, integratorId, validAfter, validBefore } = params;
  const { originSwapQuote, bridgeQuote, crossSwap, contracts } = quotes;
  const originChainId = crossSwap.inputToken.chainId;
  const { originSwapEntryPoint, depositEntryPoint, originRouter } = contracts;

  let entryPointContract:
    | DepositEntryPointContract
    | OriginSwapEntryPointContract;
  let witness: Witness;
  // The nonce passed to ERC-3009 typed data for signing.
  // This must be the witness hash computed by the contract, not a random value.
  let erc3009Nonce: string;
  let depositId: string;
  let depositSpokePool: string;
  let depositDepositor: string;

  // Random nonce for the deposit/swap data struct (used to compute the witness hash)
  const internalNonce = utils.hexlify(utils.randomBytes(32));
  const signatureOwner = crossSwap.depositor;

  if (originSwapQuote) {
    if (!originSwapEntryPoint) {
      throw new Error(
        `'originSwapEntryPoint' needs to be defined for origin swap quotes`
      );
    }
    // Only SpokePoolPeriphery supports transfer with auth
    if (originSwapEntryPoint.name !== "SpokePoolPeriphery") {
      throw new Error(
        `Transfer with auth is not supported for origin swap entry point contract '${originSwapEntryPoint.name}'`
      );
    }

    if (!originRouter) {
      throw new Error(
        `'originRouter' needs to be defined for origin swap quotes`
      );
    }
    const swapAndDepositData = await extractSwapAndDepositDataStruct(
      quotes,
      originRouter.transferType ?? TransferType.Transfer,
      undefined,
      undefined // TODO: add submission fees
    );

    // Add internal nonce and spokePool to the swap and deposit data
    const swapAndDepositDataWithNonce = {
      ...swapAndDepositData,
      nonce: internalNonce,
    };

    witness = {
      type: "BridgeAndSwapWitness",
      data: swapAndDepositDataWithNonce,
    };
    entryPointContract = originSwapEntryPoint;
    depositSpokePool = swapAndDepositDataWithNonce.spokePool;
    depositDepositor = swapAndDepositDataWithNonce.depositData.depositor;
  } else {
    if (!depositEntryPoint) {
      throw new Error(
        `'depositEntryPoint' needs to be defined for bridge quotes`
      );
    }

    if (depositEntryPoint.name !== "SpokePoolPeriphery") {
      throw new Error(
        `auth is not supported for deposit entry point contract '${depositEntryPoint.name}'`
      );
    }
    const depositData = await extractDepositDataStruct(
      quotes,
      undefined // TODO: add submission fees
    );

    // Build the full deposit data struct with nonce and spokePool
    // Note: spokePool is the actual SpokePool contract address where the deposit will be made,
    // not the SpokePoolPeriphery address (which is the entry point that receives the auth)
    const depositDataWithNonce = {
      ...depositData,
      spokePool: getSpokePoolAddress(originChainId),
      nonce: internalNonce,
    };

    witness = {
      type: "BridgeWitness",
      data: depositDataWithNonce,
    };
    entryPointContract = depositEntryPoint;
    depositSpokePool = depositDataWithNonce.spokePool;
    depositDepositor = depositDataWithNonce.baseDepositData.depositor;
  }

  const spokePoolPeriphery = getSpokePoolPeriphery(
    entryPointContract.address,
    originChainId
  );
  const [authorizationNonceIdentifier, witnessNonce] = await Promise.all([
    spokePoolPeriphery.AUTHORIZATION_NONCE_IDENTIFIER(),
    witness.type === "BridgeAndSwapWitness"
      ? spokePoolPeriphery.getERC3009SwapAndBridgeWitness(witness.data)
      : spokePoolPeriphery.getERC3009DepositWitness(witness.data),
  ]);
  erc3009Nonce = witnessNonce;
  depositId = (
    await spokePoolPeriphery.getDepositId(
      depositDepositor,
      signatureOwner,
      authorizationNonceIdentifier,
      erc3009Nonce,
      depositSpokePool
    )
  ).toString();

  const authTypedData = await getReceiveWithAuthTypedData({
    tokenAddress:
      originSwapQuote?.tokenIn.address || bridgeQuote.inputToken.address,
    chainId: originChainId,
    ownerAddress: crossSwap.depositor,
    spenderAddress: entryPointContract.address,
    value: originSwapQuote?.maximumAmountIn || bridgeQuote.inputAmount,
    nonce: erc3009Nonce, // Use the witness hash as the ERC-3009 nonce
    validAfter,
    validBefore,
  });

  return {
    ecosystem: "evm-gasless",
    chainId: originChainId,
    to: entryPointContract.address,
    isGasless: true,
    data: {
      integratorId,
      type: "erc3009",
      depositId,
      witness,
      permit: authTypedData.eip712,
      domainSeparator: authTypedData.domainSeparator,
    },
  };
}
