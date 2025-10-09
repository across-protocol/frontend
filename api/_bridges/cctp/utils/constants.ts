import { BigNumber, ethers } from "ethers";
import { CCTP_NO_DOMAIN } from "@across-protocol/constants";
import { TokenMessengerMinterV2Client } from "@across-protocol/contracts";
import * as sdk from "@across-protocol/sdk";
import {
  address,
  generateKeyPairSigner,
  getBase64EncodedWireTransaction,
  pipe,
  appendTransactionMessageInstruction,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  createNoopSigner,
  partiallySignTransaction,
  compileTransaction,
} from "@solana/kit";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP, CHAINS } from "../../../_constants";
import { InvalidParamError } from "../../../_errors";
import { toBytes32 } from "../../../_address";
import { getSvmProvider } from "../../../_providers";

export const CCTP_SUPPORTED_CHAINS = [
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.BASE,
  CHAIN_IDs.HYPERCORE,
  CHAIN_IDs.HYPEREVM,
  CHAIN_IDs.INK,
  CHAIN_IDs.OPTIMISM,
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.SOLANA,
  CHAIN_IDs.UNICHAIN,
  CHAIN_IDs.WORLD_CHAIN,
  // Testnets
  CHAIN_IDs.HYPEREVM_TESTNET,
  CHAIN_IDs.HYPERCORE_TESTNET,
];

export const CCTP_SUPPORTED_TOKENS = [TOKEN_SYMBOLS_MAP.USDC];

export const getCctpDomainId = (chainId: number): number => {
  const chainInfo = CHAINS[chainId];
  if (!chainInfo || chainInfo.cctpDomain === CCTP_NO_DOMAIN) {
    throw new InvalidParamError({
      message: `CCTP domain not found for chain ID ${chainId}`,
    });
  }
  return chainInfo.cctpDomain;
};

export const CCTP_FINALITY_THRESHOLDS = {
  fast: 1000,
  standard: 2000,
};

// CCTP TokenMessenger contract addresses
// Source: https://developers.circle.com/cctp/evm-smart-contracts
const DEFAULT_CCTP_TOKEN_MESSENGER_ADDRESS =
  "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d";

// Source: https://developers.circle.com/cctp/solana-programs
const CCTP_TOKEN_MESSENGER_ADDRESS_OVERRIDES: Record<number, string> = {
  [CHAIN_IDs.SOLANA]: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
};

export const getCctpTokenMessengerAddress = (chainId: number): string => {
  return (
    CCTP_TOKEN_MESSENGER_ADDRESS_OVERRIDES[chainId] ||
    DEFAULT_CCTP_TOKEN_MESSENGER_ADDRESS
  );
};

// Source: https://developers.circle.com/cctp/evm-smart-contracts
const DEFAULT_CCTP_MESSAGE_TRANSMITTER_ADDRESS =
  "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64";

// Source: https://developers.circle.com/cctp/solana-programs
const CCTP_MESSAGE_TRANSMITTER_ADDRESS_OVERRIDES: Record<number, string> = {
  [CHAIN_IDs.SOLANA]: "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
};

export const getCctpMessageTransmitterAddress = (chainId: number): string => {
  return (
    CCTP_MESSAGE_TRANSMITTER_ADDRESS_OVERRIDES[chainId] ||
    DEFAULT_CCTP_MESSAGE_TRANSMITTER_ADDRESS
  );
};

// CCTP TokenMessenger depositForBurn ABI
const CCTP_DEPOSIT_FOR_BURN_ABI = {
  inputs: [
    {
      internalType: "uint256",
      name: "amount",
      type: "uint256",
    },
    {
      internalType: "uint32",
      name: "destinationDomain",
      type: "uint32",
    },
    {
      internalType: "bytes32",
      name: "mintRecipient",
      type: "bytes32",
    },
    {
      internalType: "address",
      name: "burnToken",
      type: "address",
    },
    {
      internalType: "bytes32",
      name: "destinationCaller",
      type: "bytes32",
    },
    {
      internalType: "uint256",
      name: "maxFee",
      type: "uint256",
    },
    {
      internalType: "uint32",
      name: "minFinalityThreshold",
      type: "uint32",
    },
  ],
  name: "depositForBurn",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
};

export const encodeDepositForBurn = (params: {
  amount: BigNumber;
  destinationDomain: number;
  mintRecipient: string;
  burnToken: string;
  destinationCaller: string;
  maxFee: BigNumber; // use 0 for standard transfer
  minFinalityThreshold: number; // use 2000 for standard transfer
}): string => {
  const iface = new ethers.utils.Interface([CCTP_DEPOSIT_FOR_BURN_ABI]);

  return iface.encodeFunctionData("depositForBurn", [
    params.amount,
    params.destinationDomain,
    toBytes32(params.mintRecipient),
    params.burnToken,
    toBytes32(params.destinationCaller),
    params.maxFee,
    params.minFinalityThreshold,
  ]);
};

// CCTP estimated fill times in seconds
// Soruce: https://developers.circle.com/cctp/required-block-confirmations
export const CCTP_FILL_TIME_ESTIMATES: Record<number, number> = {
  [CHAIN_IDs.MAINNET]: 19 * 60,
  [CHAIN_IDs.ARBITRUM]: 19 * 60,
  [CHAIN_IDs.BASE]: 19 * 60,
  [CHAIN_IDs.HYPEREVM]: 5,
  [CHAIN_IDs.INK]: 30 * 60,
  [CHAIN_IDs.OPTIMISM]: 19 * 60,
  [CHAIN_IDs.POLYGON]: 8,
  [CHAIN_IDs.SOLANA]: 25,
  [CHAIN_IDs.UNICHAIN]: 19 * 60,
  [CHAIN_IDs.WORLD_CHAIN]: 19 * 60,
};

// ============================================================================
// Solana CCTP Constants and Helpers
// ============================================================================

/**
 * Builds Solana CCTP depositForBurn transaction (partially signed with event account)
 * Returns a base64-encoded transaction that has been partially signed with the messageSentEventData keypair.
 * The frontend needs to add the user's signature and send the transaction.
 */
export async function buildSolanaDepositForBurnInstructionData(params: {
  amount: BigNumber;
  destinationDomain: number;
  mintRecipient: string;
  destinationCaller: string;
  maxFee: BigNumber;
  minFinalityThreshold: number;
  depositor: string; // Solana wallet address
  inputToken: string; // USDC token address
  originChainId: number;
  destinationChainId: number;
}): Promise<string> {
  // Get USDC mint address (burn token)
  const burnTokenMint = TOKEN_SYMBOLS_MAP.USDC.addresses[params.originChainId];
  if (!burnTokenMint) {
    throw new InvalidParamError({
      message: `USDC not supported on chain ${params.originChainId}`,
    });
  }

  // Get depositor's USDC token account (ATA)
  const depositorAddr = sdk.utils.toAddressType(
    params.depositor,
    params.originChainId
  );
  const tokenMintAddr = sdk.utils.toAddressType(
    burnTokenMint,
    params.originChainId
  );

  const depositorTokenAccount = await sdk.arch.svm.getAssociatedTokenAddress(
    depositorAddr.forceSvmAddress(),
    tokenMintAddr.forceSvmAddress()
  );

  // Generate a new keypair signer for the messageSentEventData account
  const eventDataKeypair = await generateKeyPairSigner();

  // Get CCTP program addresses
  const tokenMessengerAddress = getCctpTokenMessengerAddress(
    params.originChainId
  );
  const messageTransmitterAddress = getCctpMessageTransmitterAddress(
    params.originChainId
  );

  // Get CCTP deposit accounts from SDK helper
  const cctpAccounts = await sdk.arch.svm.getCCTPDepositAccounts(
    params.originChainId,
    params.destinationDomain,
    address(tokenMessengerAddress),
    address(messageTransmitterAddress)
  );

  // Convert addresses to Solana Kit address format for instruction parameters
  const mintRecipientBytes32 = toBytes32(params.mintRecipient);
  const destinationCallerBytes32 = toBytes32(params.destinationCaller);

  const mintRecipientAddr = sdk.utils
    .toAddressType(mintRecipientBytes32, params.destinationChainId)
    .toBase58();
  const destinationCallerAddr = sdk.utils
    .toAddressType(destinationCallerBytes32, params.destinationChainId)
    .toBase58();

  // Create signers
  const depositorAddress = address(params.depositor);
  const depositorSigner = createNoopSigner(depositorAddress);

  // Use the TokenMessenger client to build the instruction
  const depositInstruction =
    await TokenMessengerMinterV2Client.getDepositForBurnInstructionAsync({
      owner: depositorSigner,
      eventRentPayer: depositorSigner,
      senderAuthorityPda: cctpAccounts.tokenMessengerMinterSenderAuthority,
      burnTokenAccount: depositorTokenAccount,
      messageTransmitter: cctpAccounts.messageTransmitter,
      tokenMessenger: cctpAccounts.tokenMessenger,
      remoteTokenMessenger: cctpAccounts.remoteTokenMessenger,
      tokenMinter: cctpAccounts.tokenMinter,
      localToken: cctpAccounts.localToken,
      burnTokenMint: address(burnTokenMint),
      messageSentEventData: eventDataKeypair,
      eventAuthority: cctpAccounts.cctpEventAuthority,
      program: address(tokenMessengerAddress),
      amount: BigInt(params.amount.toString()),
      destinationDomain: params.destinationDomain,
      mintRecipient: address(mintRecipientAddr),
      destinationCaller: address(destinationCallerAddr),
      maxFee: BigInt(params.maxFee.toString()),
      minFinalityThreshold: params.minFinalityThreshold,
    });

  // Get Solana provider to fetch recent blockhash
  const provider = getSvmProvider(params.originChainId);
  const latestBlockhash = await provider
    .createRpcClient()
    .getLatestBlockhash()
    .send();

  // Build the transaction message
  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(depositorSigner, tx),
    (tx) =>
      setTransactionMessageLifetimeUsingBlockhash(
        {
          blockhash: latestBlockhash.value.blockhash,
          lastValidBlockHeight: latestBlockhash.value.lastValidBlockHeight,
        },
        tx
      ),
    (tx) => appendTransactionMessageInstruction(depositInstruction, tx)
  );

  // Compile the transaction message to get a transaction with signature placeholders
  const compiledTx = compileTransaction(txMessage);

  // Partially sign the transaction with only the event data keypair
  // The depositor will sign on the frontend before submitting
  const partiallySignedTx = await partiallySignTransaction(
    [eventDataKeypair.keyPair],
    compiledTx
  );

  // Encode the partially signed transaction
  const base64EncodedTx = getBase64EncodedWireTransaction(partiallySignedTx);

  // Return the partially signed transaction as base64
  // Frontend will need to replace the noop depositor signature and send
  return base64EncodedTx;
}
