import { BigNumber, ethers } from "ethers";
import { CCTP_NO_DOMAIN } from "@across-protocol/constants";
import * as sdk from "@across-protocol/sdk";
import {
  address,
  getProgramDerivedAddress,
  generateKeyPairSigner,
  getBase64EncodedWireTransaction,
  pipe,
  appendTransactionMessageInstruction,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  createNoopSigner,
  addSignersToInstruction,
  partiallySignTransaction,
  compileTransaction,
  AccountRole,
} from "@solana/kit";
import { getStructEncoder } from "@solana/codecs-data-structures";
import { getU32Encoder, getU64Encoder } from "@solana/codecs-numbers";
import { getUtf8Encoder } from "@solana/codecs-strings";
import { getAddressEncoder } from "@solana/addresses";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP, CHAINS } from "../../../_constants";
import { InvalidParamError } from "../../../_errors";
import { toBytes32 } from "../../../_address";
import { getSvmProvider } from "../../../_providers";

export const CCTP_SUPPORTED_CHAINS = [
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.BASE,
  CHAIN_IDs.HYPEREVM,
  CHAIN_IDs.INK,
  CHAIN_IDs.OPTIMISM,
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.SOLANA,
  CHAIN_IDs.UNICHAIN,
  CHAIN_IDs.WORLD_CHAIN,
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

// Solana CCTP V2 Program IDs
// Source: https://developers.circle.com/cctp/solana-programs
export const CCTP_MESSAGE_TRANSMITTER_V2_SOLANA =
  "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC";
export const CCTP_TOKEN_MESSENGER_MINTER_V2_SOLANA =
  "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe";

// Solana system programs
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

// Anchor discriminator for deposit_for_burn instruction
// Computed from sha256("global:deposit_for_burn").slice(0, 8)
const DEPOSIT_FOR_BURN_DISCRIMINATOR = new Uint8Array([
  0xd7, 0x3c, 0x3d, 0x2e, 0x72, 0x37, 0x80, 0xb0,
]);

/**
 * Encodes the Solana CCTP V2 depositForBurn instruction data
 */
export function encodeSolanaDepositForBurnData(params: {
  amount: BigNumber;
  destinationDomain: number;
  mintRecipient: string; // EVM or SVM address
  destinationCaller: string; // EVM or SVM address, use ethers.constants.AddressZero for "any"
  maxFee: BigNumber;
  minFinalityThreshold: number;
  originChainId: number;
  destinationChainId: number;
}): Uint8Array {
  // Convert addresses to bytes32 (handles both EVM and SVM addresses)
  const mintRecipientBytes32 = toBytes32(params.mintRecipient);
  const destinationCallerBytes32 = toBytes32(params.destinationCaller);

  // Convert bytes32 hex to Solana address format using SDK
  const mintRecipientAddr = sdk.utils
    .toAddressType(mintRecipientBytes32, params.destinationChainId)
    .toBase58();
  const destinationCallerAddr = sdk.utils
    .toAddressType(destinationCallerBytes32, params.destinationChainId)
    .toBase58();

  // Convert to Solana Kit address type
  const mintRecipientSolana = address(mintRecipientAddr);
  const destinationCallerSolana = address(destinationCallerAddr);

  // Encode the instruction parameters
  const paramsEncoder = getStructEncoder([
    ["amount", getU64Encoder()],
    ["destinationDomain", getU32Encoder()],
    ["mintRecipient", getAddressEncoder()],
    ["destinationCaller", getAddressEncoder()],
    ["maxFee", getU64Encoder()],
    ["minFinalityThreshold", getU32Encoder()],
  ]);

  const encodedParams = paramsEncoder.encode({
    amount: BigInt(params.amount.toString()),
    destinationDomain: params.destinationDomain,
    mintRecipient: mintRecipientSolana,
    destinationCaller: destinationCallerSolana,
    maxFee: BigInt(params.maxFee.toString()),
    minFinalityThreshold: params.minFinalityThreshold,
  });

  // Combine discriminator + encoded params
  const instructionData = new Uint8Array(
    DEPOSIT_FOR_BURN_DISCRIMINATOR.length + encodedParams.length
  );
  instructionData.set(DEPOSIT_FOR_BURN_DISCRIMINATOR, 0);
  instructionData.set(encodedParams, DEPOSIT_FOR_BURN_DISCRIMINATOR.length);

  return instructionData;
}

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

  console.log("tokenMintAddr", tokenMintAddr);
  console.log(
    "tokenMintAddr.forceSvmAddress()",
    tokenMintAddr.forceSvmAddress()
  );
  console.log("depositorAddr", depositorAddr);
  console.log(
    "depositorAddr.forceSvmAddress()",
    depositorAddr.forceSvmAddress()
  );
  console.log("inputToken", address(params.inputToken));
  const depositorTokenAccount = await sdk.arch.svm.getAssociatedTokenAddress(
    depositorAddr.forceSvmAddress(),
    tokenMintAddr.forceSvmAddress()
    // address(params.inputToken)
  );

  // Generate a new keypair signer for the messageSentEventData account
  const eventDataKeypair = await generateKeyPairSigner();

  // Get CCTP deposit accounts from SDK helper
  const cctpAccounts = await sdk.arch.svm.getCCTPDepositAccounts(
    params.originChainId,
    params.destinationDomain,
    address(CCTP_TOKEN_MESSENGER_MINTER_V2_SOLANA),
    address(CCTP_MESSAGE_TRANSMITTER_V2_SOLANA)
  );

  // Encode instruction data
  const instructionData = encodeSolanaDepositForBurnData({
    amount: params.amount,
    destinationDomain: params.destinationDomain,
    mintRecipient: params.mintRecipient,
    destinationCaller: params.destinationCaller,
    maxFee: params.maxFee,
    minFinalityThreshold: params.minFinalityThreshold,
    originChainId: params.originChainId,
    destinationChainId: params.destinationChainId,
  });

  // Get Solana provider to fetch recent blockhash
  const provider = getSvmProvider(params.originChainId);
  const latestBlockhash = await provider
    .createRpcClient()
    .getLatestBlockhash()
    .send();

  // Convert depositor to Solana Kit address and create a noop signer (user will sign on frontend)
  const depositorAddress = address(params.depositor);
  const depositorSigner = createNoopSigner(depositorAddress);
  console.log("depositorSigner", depositorSigner);
  const programAddress = address(CCTP_TOKEN_MESSENGER_MINTER_V2_SOLANA);

  // Derive denylist account PDA for the depositor
  // Note: The denylist PDA is owned by the Token Messenger Minter program, not Message Transmitter
  const utf8Encoder = getUtf8Encoder();
  const addressEncoder = getAddressEncoder();

  const [denylistAccount] = await getProgramDerivedAddress({
    programAddress: programAddress, // Use Token Messenger Minter program
    seeds: [
      utf8Encoder.encode("denylist_account"),
      addressEncoder.encode(depositorAddress),
    ],
  });

  console.log("Derived denylist account:", denylistAccount);

  // Build the CCTP deposit instruction using accounts from SDK
  // Account order matches the IDL DepositForBurn instruction
  let depositInstruction = {
    programAddress,
    accounts: [
      // 0. owner (signer)
      {
        address: depositorAddress,
        role: AccountRole.READONLY_SIGNER, // AccountRole.READONLY_SIGNER
      },
      // 1. event_rent_payer (signer, writable)
      {
        address: depositorAddress,
        role: AccountRole.WRITABLE_SIGNER, // AccountRole.WRITABLE_SIGNER
      },
      // 2. sender_authority_pda
      {
        address: cctpAccounts.tokenMessengerMinterSenderAuthority,
        role: AccountRole.READONLY,
      },
      // 3. burn_token_account (writable)
      {
        address: depositorTokenAccount,
        role: 1, // AccountRole.WRITABLE
      },
      // 4. denylist_account
      {
        address: denylistAccount,
        role: 0, // AccountRole.READONLY
      },
      // 5. message_transmitter (writable)
      {
        address: cctpAccounts.messageTransmitter,
        role: 1,
      },
      // 5. token_messenger
      {
        address: cctpAccounts.tokenMessenger,
        role: 0,
      },
      // 6. remote_token_messenger
      {
        address: cctpAccounts.remoteTokenMessenger,
        role: 0,
      },
      // 7. token_minter
      {
        address: cctpAccounts.tokenMinter,
        role: 0,
      },
      // 8. local_token (writable)
      {
        address: cctpAccounts.localToken,
        role: 1,
      },
      // 9. burn_token_mint (writable)
      {
        address: address(burnTokenMint),
        role: 1,
      },
      // 10. message_sent_event_data (writable, signer) - newly generated keypair
      {
        address: eventDataKeypair.address,
        role: 3,
      },
      // 11. message_transmitter_program
      {
        address: address(CCTP_MESSAGE_TRANSMITTER_V2_SOLANA),
        role: 0,
      },
      // 12. token_messenger_minter_program
      {
        address: programAddress,
        role: 0,
      },
      // 13. token_program
      {
        address: address(TOKEN_PROGRAM_ID),
        role: 0,
      },
      // 14. system_program
      {
        address: address(SYSTEM_PROGRAM_ID),
        role: 0,
      },
      // 15. event_authority
      {
        address: cctpAccounts.cctpEventAuthority,
        role: 0,
      },
      // 16. program
      {
        address: programAddress,
        role: 0,
      },
    ],
    data: instructionData,
  };

  // Log accounts with their hardcoded name
  const accounts = [
    "owner",
    "event_rent_payer",
    "sender_authority_pda",
    "burn_token_account",
    "denylist_account",
    "message_transmitter",
    "token_messenger",
    "remote_token_messenger",
    "token_minter",
    "local_token",
    "burn_token_mint",
    "message_sent_event_data",
    "message_transmitter_program",
    "token_messenger_minter_program",
    "token_program",
    "system_program",
    "event_authority",
    "program",
  ];
  console.log(
    "depositInstruction accounts",
    depositInstruction.accounts.map((acc, index) => ({
      name: accounts[index],
      address: acc.address,
      role: acc.role,
    }))
  );

  console.log("depositInstruction", depositInstruction);

  // Add the event keypair signer to the instruction
  // The depositor noop signer will be handled at the transaction message level
  depositInstruction = addSignersToInstruction(
    [eventDataKeypair],
    depositInstruction
  );

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
  // Note: partiallySignTransaction expects (keyPairs, transaction) where keyPairs is CryptoKeyPair[]
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
