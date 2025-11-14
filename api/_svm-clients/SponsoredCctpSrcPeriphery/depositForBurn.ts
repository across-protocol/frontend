/**
 * NOTE: This file was auto-generated using the codama library and should be eventually
 * used via the @across-protocol/contracts package. But as the package is not yet published
 * with the latest SponsoredCCTPSrcPeriphery SVM program, we're keeping the file here for now.
 */
import {
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type IAccountMeta,
  type IAccountSignerMeta,
  type IInstruction,
  type IInstructionWithAccounts,
  type IInstructionWithData,
  type ReadonlyUint8Array,
  type TransactionSigner,
  AccountRole,
  combineCodec,
  fixDecoderSize,
  fixEncoderSize,
  getAddressDecoder,
  getAddressEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  getU64Decoder,
  getU64Encoder,
  getU8Decoder,
  getU8Encoder,
  isTransactionSigner,
  transformEncoder,
  upgradeRoleToSigner,
  addEncoderSizePrefix,
  addDecoderSizePrefix,
} from "@solana/kit";

// Program address constant
export const SPONSORED_CCTP_SRC_PERIPHERY_PROGRAM_ADDRESS =
  "CPr4bRvkVKcSCLyrQpkZrRrwGzQeVAXutFU8WupuBLXq" as Address;

// Discriminator for depositForBurn instruction
export const DEPOSIT_FOR_BURN_DISCRIMINATOR = new Uint8Array([
  215, 60, 61, 46, 114, 55, 128, 176,
]);

// SponsoredCCTPQuote types
export type SponsoredCCTPQuote = {
  sourceDomain: number;
  destinationDomain: number;
  mintRecipient: Address;
  amount: bigint;
  burnToken: Address;
  destinationCaller: Address;
  maxFee: bigint;
  minFinalityThreshold: number;
  nonce: ReadonlyUint8Array;
  deadline: bigint;
  maxBpsToSponsor: bigint;
  maxUserSlippageBps: bigint;
  finalRecipient: Address;
  finalToken: Address;
  executionMode: number;
  actionData: ReadonlyUint8Array;
};

export type SponsoredCCTPQuoteArgs = {
  sourceDomain: number;
  destinationDomain: number;
  mintRecipient: Address;
  amount: number | bigint;
  burnToken: Address;
  destinationCaller: Address;
  maxFee: number | bigint;
  minFinalityThreshold: number;
  nonce: ReadonlyUint8Array;
  deadline: number | bigint;
  maxBpsToSponsor: number | bigint;
  maxUserSlippageBps: number | bigint;
  finalRecipient: Address;
  finalToken: Address;
  executionMode: number;
  actionData: ReadonlyUint8Array;
};

// Encoder/Decoder for SponsoredCCTPQuote
export function getSponsoredCCTPQuoteEncoder(): Encoder<SponsoredCCTPQuoteArgs> {
  return getStructEncoder([
    ["sourceDomain", getU32Encoder()],
    ["destinationDomain", getU32Encoder()],
    ["mintRecipient", getAddressEncoder()],
    ["amount", getU64Encoder()],
    ["burnToken", getAddressEncoder()],
    ["destinationCaller", getAddressEncoder()],
    ["maxFee", getU64Encoder()],
    ["minFinalityThreshold", getU32Encoder()],
    ["nonce", fixEncoderSize(getBytesEncoder(), 32)],
    ["deadline", getU64Encoder()],
    ["maxBpsToSponsor", getU64Encoder()],
    ["maxUserSlippageBps", getU64Encoder()],
    ["finalRecipient", getAddressEncoder()],
    ["finalToken", getAddressEncoder()],
    ["executionMode", getU8Encoder()],
    ["actionData", addEncoderSizePrefix(getBytesEncoder(), getU32Encoder())],
  ]);
}

export function getSponsoredCCTPQuoteDecoder(): Decoder<SponsoredCCTPQuote> {
  return getStructDecoder([
    ["sourceDomain", getU32Decoder()],
    ["destinationDomain", getU32Decoder()],
    ["mintRecipient", getAddressDecoder()],
    ["amount", getU64Decoder()],
    ["burnToken", getAddressDecoder()],
    ["destinationCaller", getAddressDecoder()],
    ["maxFee", getU64Decoder()],
    ["minFinalityThreshold", getU32Decoder()],
    ["nonce", fixDecoderSize(getBytesDecoder(), 32)],
    ["deadline", getU64Decoder()],
    ["maxBpsToSponsor", getU64Decoder()],
    ["maxUserSlippageBps", getU64Decoder()],
    ["finalRecipient", getAddressDecoder()],
    ["finalToken", getAddressDecoder()],
    ["executionMode", getU8Decoder()],
    ["actionData", addDecoderSizePrefix(getBytesDecoder(), getU32Decoder())],
  ]);
}

export function getSponsoredCCTPQuoteCodec(): Codec<
  SponsoredCCTPQuoteArgs,
  SponsoredCCTPQuote
> {
  return combineCodec(
    getSponsoredCCTPQuoteEncoder(),
    getSponsoredCCTPQuoteDecoder()
  );
}

// Helper functions
function expectAddress<T extends string = string>(
  value: Address<T> | TransactionSigner<T> | null | undefined
): Address<T> {
  if (!value) {
    throw new Error("Expected a Address.");
  }
  if (typeof value === "object" && "address" in value) {
    return value.address;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return value as Address<T>;
}

type ResolvedAccount<T extends string = string> = {
  isWritable: boolean;
  value: Address<T> | TransactionSigner<T> | null;
};

function getAccountMetaFactory(
  programAddress: Address,
  optionalAccountStrategy: "omitted" | "programId"
) {
  return (
    account: ResolvedAccount
  ): IAccountMeta | IAccountSignerMeta | undefined => {
    if (!account.value) {
      if (optionalAccountStrategy === "omitted") return;
      return Object.freeze({
        address: programAddress,
        role: AccountRole.READONLY,
      });
    }
    const writableRole = account.isWritable
      ? AccountRole.WRITABLE
      : AccountRole.READONLY;
    const addressValue = account.value;
    const isSigner =
      addressValue &&
      typeof addressValue === "object" &&
      "address" in addressValue &&
      isTransactionSigner(addressValue);
    return Object.freeze({
      address: expectAddress(addressValue),
      role: isSigner ? upgradeRoleToSigner(writableRole) : writableRole,
      ...(isSigner && addressValue ? { signer: addressValue } : {}),
    });
  };
}

// Instruction data types
export type DepositForBurnInstructionData = {
  discriminator: ReadonlyUint8Array;
  quote: SponsoredCCTPQuote;
  signature: ReadonlyUint8Array;
};

export type DepositForBurnInstructionDataArgs = {
  quote: SponsoredCCTPQuoteArgs;
  signature: ReadonlyUint8Array;
};

// Instruction data encoder/decoder
export function getDepositForBurnDiscriminatorBytes(): ReadonlyUint8Array {
  return fixEncoderSize(getBytesEncoder(), 8).encode(
    DEPOSIT_FOR_BURN_DISCRIMINATOR
  );
}

export function getDepositForBurnInstructionDataEncoder(): Encoder<DepositForBurnInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ["discriminator", fixEncoderSize(getBytesEncoder(), 8)],
      ["quote", getSponsoredCCTPQuoteEncoder()],
      ["signature", fixEncoderSize(getBytesEncoder(), 65)],
    ]),
    (value) => ({ ...value, discriminator: DEPOSIT_FOR_BURN_DISCRIMINATOR })
  );
}

export function getDepositForBurnInstructionDataDecoder(): Decoder<DepositForBurnInstructionData> {
  return getStructDecoder([
    ["discriminator", fixDecoderSize(getBytesDecoder(), 8)],
    ["quote", getSponsoredCCTPQuoteDecoder()],
    ["signature", fixDecoderSize(getBytesDecoder(), 65)],
  ]);
}

export function getDepositForBurnInstructionDataCodec(): Codec<
  DepositForBurnInstructionDataArgs,
  DepositForBurnInstructionData
> {
  return combineCodec(
    getDepositForBurnInstructionDataEncoder(),
    getDepositForBurnInstructionDataDecoder()
  );
}

// Instruction types
export type DepositForBurnInstruction<
  TProgram extends string = typeof SPONSORED_CCTP_SRC_PERIPHERY_PROGRAM_ADDRESS,
  TAccountSigner extends string | IAccountMeta<string> = string,
  TAccountState extends string | IAccountMeta<string> = string,
  TAccountRentFund extends string | IAccountMeta<string> = string,
  TAccountUsedNonce extends string | IAccountMeta<string> = string,
  TAccountDepositorTokenAccount extends string | IAccountMeta<string> = string,
  TAccountBurnToken extends string | IAccountMeta<string> = string,
  TAccountDenylistAccount extends string | IAccountMeta<string> = string,
  TAccountTokenMessengerMinterSenderAuthority extends
    | string
    | IAccountMeta<string> = string,
  TAccountMessageTransmitter extends string | IAccountMeta<string> = string,
  TAccountTokenMessenger extends string | IAccountMeta<string> = string,
  TAccountRemoteTokenMessenger extends string | IAccountMeta<string> = string,
  TAccountTokenMinter extends string | IAccountMeta<string> = string,
  TAccountLocalToken extends string | IAccountMeta<string> = string,
  TAccountCctpEventAuthority extends string | IAccountMeta<string> = string,
  TAccountMessageSentEventData extends string | IAccountMeta<string> = string,
  TAccountMessageTransmitterProgram extends
    | string
    | IAccountMeta<string> = "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
  TAccountTokenMessengerMinterProgram extends
    | string
    | IAccountMeta<string> = "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
  TAccountTokenProgram extends
    | string
    | IAccountMeta<string> = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  TAccountSystemProgram extends
    | string
    | IAccountMeta<string> = "11111111111111111111111111111111",
  TAccountEventAuthority extends string | IAccountMeta<string> = string,
  TAccountProgram extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountSigner extends string
        ? IAccountSignerMeta<TAccountSigner> & {
            address: Address<TAccountSigner>;
            role: AccountRole;
          }
        : TAccountSigner,
      TAccountState extends string
        ? IAccountMeta<TAccountState> & {
            address: Address<TAccountState>;
            role: AccountRole;
          }
        : TAccountState,
      TAccountRentFund extends string
        ? IAccountMeta<TAccountRentFund> & {
            address: Address<TAccountRentFund>;
            role: AccountRole;
          }
        : TAccountRentFund,
      TAccountUsedNonce extends string
        ? IAccountMeta<TAccountUsedNonce> & {
            address: Address<TAccountUsedNonce>;
            role: AccountRole;
          }
        : TAccountUsedNonce,
      TAccountDepositorTokenAccount extends string
        ? IAccountMeta<TAccountDepositorTokenAccount> & {
            address: Address<TAccountDepositorTokenAccount>;
            role: AccountRole;
          }
        : TAccountDepositorTokenAccount,
      TAccountBurnToken extends string
        ? IAccountMeta<TAccountBurnToken> & {
            address: Address<TAccountBurnToken>;
            role: AccountRole;
          }
        : TAccountBurnToken,
      TAccountDenylistAccount extends string
        ? IAccountMeta<TAccountDenylistAccount> & {
            address: Address<TAccountDenylistAccount>;
            role: AccountRole;
          }
        : TAccountDenylistAccount,
      TAccountTokenMessengerMinterSenderAuthority extends string
        ? IAccountMeta<TAccountTokenMessengerMinterSenderAuthority> & {
            address: Address<TAccountTokenMessengerMinterSenderAuthority>;
            role: AccountRole;
          }
        : TAccountTokenMessengerMinterSenderAuthority,
      TAccountMessageTransmitter extends string
        ? IAccountMeta<TAccountMessageTransmitter> & {
            address: Address<TAccountMessageTransmitter>;
            role: AccountRole;
          }
        : TAccountMessageTransmitter,
      TAccountTokenMessenger extends string
        ? IAccountMeta<TAccountTokenMessenger> & {
            address: Address<TAccountTokenMessenger>;
            role: AccountRole;
          }
        : TAccountTokenMessenger,
      TAccountRemoteTokenMessenger extends string
        ? IAccountMeta<TAccountRemoteTokenMessenger> & {
            address: Address<TAccountRemoteTokenMessenger>;
            role: AccountRole;
          }
        : TAccountRemoteTokenMessenger,
      TAccountTokenMinter extends string
        ? IAccountMeta<TAccountTokenMinter> & {
            address: Address<TAccountTokenMinter>;
            role: AccountRole;
          }
        : TAccountTokenMinter,
      TAccountLocalToken extends string
        ? IAccountMeta<TAccountLocalToken> & {
            address: Address<TAccountLocalToken>;
            role: AccountRole;
          }
        : TAccountLocalToken,
      TAccountCctpEventAuthority extends string
        ? IAccountMeta<TAccountCctpEventAuthority> & {
            address: Address<TAccountCctpEventAuthority>;
            role: AccountRole;
          }
        : TAccountCctpEventAuthority,
      TAccountMessageSentEventData extends string
        ? IAccountSignerMeta<TAccountMessageSentEventData> & {
            address: Address<TAccountMessageSentEventData>;
            role: AccountRole;
          }
        : TAccountMessageSentEventData,
      TAccountMessageTransmitterProgram extends string
        ? IAccountMeta<TAccountMessageTransmitterProgram> & {
            address: Address<TAccountMessageTransmitterProgram>;
            role: AccountRole;
          }
        : TAccountMessageTransmitterProgram,
      TAccountTokenMessengerMinterProgram extends string
        ? IAccountMeta<TAccountTokenMessengerMinterProgram> & {
            address: Address<TAccountTokenMessengerMinterProgram>;
            role: AccountRole;
          }
        : TAccountTokenMessengerMinterProgram,
      TAccountTokenProgram extends string
        ? IAccountMeta<TAccountTokenProgram> & {
            address: Address<TAccountTokenProgram>;
            role: AccountRole;
          }
        : TAccountTokenProgram,
      TAccountSystemProgram extends string
        ? IAccountMeta<TAccountSystemProgram> & {
            address: Address<TAccountSystemProgram>;
            role: AccountRole;
          }
        : TAccountSystemProgram,
      TAccountEventAuthority extends string
        ? IAccountMeta<TAccountEventAuthority> & {
            address: Address<TAccountEventAuthority>;
            role: AccountRole;
          }
        : TAccountEventAuthority,
      TAccountProgram extends string
        ? IAccountMeta<TAccountProgram> & {
            address: Address<TAccountProgram>;
            role: AccountRole;
          }
        : TAccountProgram,
      ...TRemainingAccounts,
    ]
  >;

export type DepositForBurnAsyncInput<
  TAccountSigner extends string = string,
  TAccountState extends string = string,
  TAccountRentFund extends string = string,
  TAccountUsedNonce extends string = string,
  TAccountDepositorTokenAccount extends string = string,
  TAccountBurnToken extends string = string,
  TAccountDenylistAccount extends string = string,
  TAccountTokenMessengerMinterSenderAuthority extends string = string,
  TAccountMessageTransmitter extends string = string,
  TAccountTokenMessenger extends string = string,
  TAccountRemoteTokenMessenger extends string = string,
  TAccountTokenMinter extends string = string,
  TAccountLocalToken extends string = string,
  TAccountCctpEventAuthority extends string = string,
  TAccountMessageSentEventData extends string = string,
  TAccountMessageTransmitterProgram extends string = string,
  TAccountTokenMessengerMinterProgram extends string = string,
  TAccountTokenProgram extends string = string,
  TAccountSystemProgram extends string = string,
  TAccountEventAuthority extends string = string,
  TAccountProgram extends string = string,
> = {
  signer: TransactionSigner<TAccountSigner>;
  state?: Address<TAccountState>;
  rentFund?: Address<TAccountRentFund>;
  usedNonce: Address<TAccountUsedNonce>;
  depositorTokenAccount?: Address<TAccountDepositorTokenAccount>;
  burnToken: Address<TAccountBurnToken>;
  denylistAccount: Address<TAccountDenylistAccount>;
  tokenMessengerMinterSenderAuthority: Address<TAccountTokenMessengerMinterSenderAuthority>;
  messageTransmitter: Address<TAccountMessageTransmitter>;
  tokenMessenger: Address<TAccountTokenMessenger>;
  remoteTokenMessenger: Address<TAccountRemoteTokenMessenger>;
  tokenMinter: Address<TAccountTokenMinter>;
  localToken: Address<TAccountLocalToken>;
  cctpEventAuthority: Address<TAccountCctpEventAuthority>;
  messageSentEventData: TransactionSigner<TAccountMessageSentEventData>;
  messageTransmitterProgram?: Address<TAccountMessageTransmitterProgram>;
  tokenMessengerMinterProgram?: Address<TAccountTokenMessengerMinterProgram>;
  tokenProgram?: Address<TAccountTokenProgram>;
  systemProgram?: Address<TAccountSystemProgram>;
  eventAuthority?: Address<TAccountEventAuthority>;
  program: Address<TAccountProgram>;
  quote: DepositForBurnInstructionDataArgs["quote"];
  signature: DepositForBurnInstructionDataArgs["signature"];
};

export type DepositForBurnInput<
  TAccountSigner extends string = string,
  TAccountState extends string = string,
  TAccountRentFund extends string = string,
  TAccountUsedNonce extends string = string,
  TAccountDepositorTokenAccount extends string = string,
  TAccountBurnToken extends string = string,
  TAccountDenylistAccount extends string = string,
  TAccountTokenMessengerMinterSenderAuthority extends string = string,
  TAccountMessageTransmitter extends string = string,
  TAccountTokenMessenger extends string = string,
  TAccountRemoteTokenMessenger extends string = string,
  TAccountTokenMinter extends string = string,
  TAccountLocalToken extends string = string,
  TAccountCctpEventAuthority extends string = string,
  TAccountMessageSentEventData extends string = string,
  TAccountMessageTransmitterProgram extends string = string,
  TAccountTokenMessengerMinterProgram extends string = string,
  TAccountTokenProgram extends string = string,
  TAccountSystemProgram extends string = string,
  TAccountEventAuthority extends string = string,
  TAccountProgram extends string = string,
> = {
  signer: TransactionSigner<TAccountSigner>;
  state: Address<TAccountState>;
  rentFund: Address<TAccountRentFund>;
  usedNonce: Address<TAccountUsedNonce>;
  depositorTokenAccount: Address<TAccountDepositorTokenAccount>;
  burnToken: Address<TAccountBurnToken>;
  denylistAccount: Address<TAccountDenylistAccount>;
  tokenMessengerMinterSenderAuthority: Address<TAccountTokenMessengerMinterSenderAuthority>;
  messageTransmitter: Address<TAccountMessageTransmitter>;
  tokenMessenger: Address<TAccountTokenMessenger>;
  remoteTokenMessenger: Address<TAccountRemoteTokenMessenger>;
  tokenMinter: Address<TAccountTokenMinter>;
  localToken: Address<TAccountLocalToken>;
  cctpEventAuthority: Address<TAccountCctpEventAuthority>;
  messageSentEventData: TransactionSigner<TAccountMessageSentEventData>;
  messageTransmitterProgram?: Address<TAccountMessageTransmitterProgram>;
  tokenMessengerMinterProgram?: Address<TAccountTokenMessengerMinterProgram>;
  tokenProgram?: Address<TAccountTokenProgram>;
  systemProgram?: Address<TAccountSystemProgram>;
  eventAuthority: Address<TAccountEventAuthority>;
  program: Address<TAccountProgram>;
  quote: DepositForBurnInstructionDataArgs["quote"];
  signature: DepositForBurnInstructionDataArgs["signature"];
};

export type ParsedDepositForBurnInstruction<
  TProgram extends string = typeof SPONSORED_CCTP_SRC_PERIPHERY_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    signer: TAccountMetas[0];
    state: TAccountMetas[1];
    rentFund: TAccountMetas[2];
    usedNonce: TAccountMetas[3];
    depositorTokenAccount: TAccountMetas[4];
    burnToken: TAccountMetas[5];
    denylistAccount: TAccountMetas[6];
    tokenMessengerMinterSenderAuthority: TAccountMetas[7];
    messageTransmitter: TAccountMetas[8];
    tokenMessenger: TAccountMetas[9];
    remoteTokenMessenger: TAccountMetas[10];
    tokenMinter: TAccountMetas[11];
    localToken: TAccountMetas[12];
    cctpEventAuthority: TAccountMetas[13];
    messageSentEventData: TAccountMetas[14];
    messageTransmitterProgram: TAccountMetas[15];
    tokenMessengerMinterProgram: TAccountMetas[16];
    tokenProgram: TAccountMetas[17];
    systemProgram: TAccountMetas[18];
    eventAuthority: TAccountMetas[19];
    program: TAccountMetas[20];
  };
  data: DepositForBurnInstructionData;
};

// Main instruction builders
export async function getDepositForBurnInstructionAsync<
  TAccountSigner extends string,
  TAccountState extends string,
  TAccountRentFund extends string,
  TAccountUsedNonce extends string,
  TAccountDepositorTokenAccount extends string,
  TAccountBurnToken extends string,
  TAccountDenylistAccount extends string,
  TAccountTokenMessengerMinterSenderAuthority extends string,
  TAccountMessageTransmitter extends string,
  TAccountTokenMessenger extends string,
  TAccountRemoteTokenMessenger extends string,
  TAccountTokenMinter extends string,
  TAccountLocalToken extends string,
  TAccountCctpEventAuthority extends string,
  TAccountMessageSentEventData extends string,
  TAccountMessageTransmitterProgram extends string,
  TAccountTokenMessengerMinterProgram extends string,
  TAccountTokenProgram extends string,
  TAccountSystemProgram extends string,
  TAccountEventAuthority extends string,
  TAccountProgram extends string,
  TProgramAddress extends
    Address = typeof SPONSORED_CCTP_SRC_PERIPHERY_PROGRAM_ADDRESS,
>(
  input: DepositForBurnAsyncInput<
    TAccountSigner,
    TAccountState,
    TAccountRentFund,
    TAccountUsedNonce,
    TAccountDepositorTokenAccount,
    TAccountBurnToken,
    TAccountDenylistAccount,
    TAccountTokenMessengerMinterSenderAuthority,
    TAccountMessageTransmitter,
    TAccountTokenMessenger,
    TAccountRemoteTokenMessenger,
    TAccountTokenMinter,
    TAccountLocalToken,
    TAccountCctpEventAuthority,
    TAccountMessageSentEventData,
    TAccountMessageTransmitterProgram,
    TAccountTokenMessengerMinterProgram,
    TAccountTokenProgram,
    TAccountSystemProgram,
    TAccountEventAuthority,
    TAccountProgram
  >,
  config?: {
    programAddress?: TProgramAddress;
  }
): Promise<
  DepositForBurnInstruction<
    TProgramAddress,
    TAccountSigner,
    TAccountState,
    TAccountRentFund,
    TAccountUsedNonce,
    TAccountDepositorTokenAccount,
    TAccountBurnToken,
    TAccountDenylistAccount,
    TAccountTokenMessengerMinterSenderAuthority,
    TAccountMessageTransmitter,
    TAccountTokenMessenger,
    TAccountRemoteTokenMessenger,
    TAccountTokenMinter,
    TAccountLocalToken,
    TAccountCctpEventAuthority,
    TAccountMessageSentEventData,
    TAccountMessageTransmitterProgram,
    TAccountTokenMessengerMinterProgram,
    TAccountTokenProgram,
    TAccountSystemProgram,
    TAccountEventAuthority,
    TAccountProgram
  >
> {
  const programAddress =
    (config?.programAddress as Address) ??
    SPONSORED_CCTP_SRC_PERIPHERY_PROGRAM_ADDRESS;

  const originalAccounts = {
    signer: { value: input.signer ?? null, isWritable: true },
    state: { value: input.state ?? null, isWritable: false },
    rentFund: { value: input.rentFund ?? null, isWritable: true },
    usedNonce: { value: input.usedNonce ?? null, isWritable: true },
    depositorTokenAccount: {
      value: input.depositorTokenAccount ?? null,
      isWritable: true,
    },
    burnToken: { value: input.burnToken ?? null, isWritable: true },
    denylistAccount: {
      value: input.denylistAccount ?? null,
      isWritable: false,
    },
    tokenMessengerMinterSenderAuthority: {
      value: input.tokenMessengerMinterSenderAuthority ?? null,
      isWritable: false,
    },
    messageTransmitter: {
      value: input.messageTransmitter ?? null,
      isWritable: true,
    },
    tokenMessenger: { value: input.tokenMessenger ?? null, isWritable: false },
    remoteTokenMessenger: {
      value: input.remoteTokenMessenger ?? null,
      isWritable: false,
    },
    tokenMinter: { value: input.tokenMinter ?? null, isWritable: false },
    localToken: { value: input.localToken ?? null, isWritable: true },
    cctpEventAuthority: {
      value: input.cctpEventAuthority ?? null,
      isWritable: false,
    },
    messageSentEventData: {
      value: input.messageSentEventData ?? null,
      isWritable: true,
    },
    messageTransmitterProgram: {
      value: input.messageTransmitterProgram ?? null,
      isWritable: false,
    },
    tokenMessengerMinterProgram: {
      value: input.tokenMessengerMinterProgram ?? null,
      isWritable: false,
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    eventAuthority: { value: input.eventAuthority ?? null, isWritable: false },
    program: { value: input.program ?? null, isWritable: false },
  };

  const accounts = originalAccounts;
  const args = { ...input };

  // Resolve default values
  if (!accounts.state.value) {
    const [pda] = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder().encode(new Uint8Array([115, 116, 97, 116, 101])),
      ],
    });
    accounts.state.value = pda as Address<TAccountState>;
  }
  if (!accounts.rentFund.value) {
    const [pda] = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder().encode(
          new Uint8Array([114, 101, 110, 116, 95, 102, 117, 110, 100])
        ),
      ],
    });
    accounts.rentFund.value = pda as Address<TAccountRentFund>;
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value =
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address<TAccountTokenProgram>;
  }
  if (!accounts.depositorTokenAccount.value) {
    const [pda] = await getProgramDerivedAddress({
      programAddress: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address,
      seeds: [
        getAddressEncoder().encode(expectAddress(accounts.signer.value)),
        getAddressEncoder().encode(expectAddress(accounts.tokenProgram.value)),
        getAddressEncoder().encode(expectAddress(accounts.burnToken.value)),
      ],
    });
    accounts.depositorTokenAccount.value =
      pda as Address<TAccountDepositorTokenAccount>;
  }
  if (!accounts.messageTransmitterProgram.value) {
    accounts.messageTransmitterProgram.value =
      "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC" as Address<TAccountMessageTransmitterProgram>;
  }
  if (!accounts.tokenMessengerMinterProgram.value) {
    accounts.tokenMessengerMinterProgram.value =
      "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe" as Address<TAccountTokenMessengerMinterProgram>;
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value =
      "11111111111111111111111111111111" as Address<TAccountSystemProgram>;
  }
  if (!accounts.eventAuthority.value) {
    const [pda] = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder().encode(
          new Uint8Array([
            95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111, 114,
            105, 116, 121,
          ])
        ),
      ],
    });
    accounts.eventAuthority.value = pda as Address<TAccountEventAuthority>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  const instruction = {
    accounts: [
      getAccountMeta(accounts.signer),
      getAccountMeta(accounts.state),
      getAccountMeta(accounts.rentFund),
      getAccountMeta(accounts.usedNonce),
      getAccountMeta(accounts.depositorTokenAccount),
      getAccountMeta(accounts.burnToken),
      getAccountMeta(accounts.denylistAccount),
      getAccountMeta(accounts.tokenMessengerMinterSenderAuthority),
      getAccountMeta(accounts.messageTransmitter),
      getAccountMeta(accounts.tokenMessenger),
      getAccountMeta(accounts.remoteTokenMessenger),
      getAccountMeta(accounts.tokenMinter),
      getAccountMeta(accounts.localToken),
      getAccountMeta(accounts.cctpEventAuthority),
      getAccountMeta(accounts.messageSentEventData),
      getAccountMeta(accounts.messageTransmitterProgram),
      getAccountMeta(accounts.tokenMessengerMinterProgram),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.eventAuthority),
      getAccountMeta(accounts.program),
    ].filter(
      (meta): meta is IAccountMeta | IAccountSignerMeta => meta !== undefined
    ),
    programAddress,
    data: getDepositForBurnInstructionDataEncoder().encode(args),
  };
  return instruction as DepositForBurnInstruction<
    TProgramAddress,
    TAccountSigner,
    TAccountState,
    TAccountRentFund,
    TAccountUsedNonce,
    TAccountDepositorTokenAccount,
    TAccountBurnToken,
    TAccountDenylistAccount,
    TAccountTokenMessengerMinterSenderAuthority,
    TAccountMessageTransmitter,
    TAccountTokenMessenger,
    TAccountRemoteTokenMessenger,
    TAccountTokenMinter,
    TAccountLocalToken,
    TAccountCctpEventAuthority,
    TAccountMessageSentEventData,
    TAccountMessageTransmitterProgram,
    TAccountTokenMessengerMinterProgram,
    TAccountTokenProgram,
    TAccountSystemProgram,
    TAccountEventAuthority,
    TAccountProgram
  >;
}

export function getDepositForBurnInstruction<
  TAccountSigner extends string,
  TAccountState extends string,
  TAccountRentFund extends string,
  TAccountUsedNonce extends string,
  TAccountDepositorTokenAccount extends string,
  TAccountBurnToken extends string,
  TAccountDenylistAccount extends string,
  TAccountTokenMessengerMinterSenderAuthority extends string,
  TAccountMessageTransmitter extends string,
  TAccountTokenMessenger extends string,
  TAccountRemoteTokenMessenger extends string,
  TAccountTokenMinter extends string,
  TAccountLocalToken extends string,
  TAccountCctpEventAuthority extends string,
  TAccountMessageSentEventData extends string,
  TAccountMessageTransmitterProgram extends string,
  TAccountTokenMessengerMinterProgram extends string,
  TAccountTokenProgram extends string,
  TAccountSystemProgram extends string,
  TAccountEventAuthority extends string,
  TAccountProgram extends string,
  TProgramAddress extends
    Address = typeof SPONSORED_CCTP_SRC_PERIPHERY_PROGRAM_ADDRESS,
>(
  input: DepositForBurnInput<
    TAccountSigner,
    TAccountState,
    TAccountRentFund,
    TAccountUsedNonce,
    TAccountDepositorTokenAccount,
    TAccountBurnToken,
    TAccountDenylistAccount,
    TAccountTokenMessengerMinterSenderAuthority,
    TAccountMessageTransmitter,
    TAccountTokenMessenger,
    TAccountRemoteTokenMessenger,
    TAccountTokenMinter,
    TAccountLocalToken,
    TAccountCctpEventAuthority,
    TAccountMessageSentEventData,
    TAccountMessageTransmitterProgram,
    TAccountTokenMessengerMinterProgram,
    TAccountTokenProgram,
    TAccountSystemProgram,
    TAccountEventAuthority,
    TAccountProgram
  >,
  config?: {
    programAddress?: TProgramAddress;
  }
): DepositForBurnInstruction<
  TProgramAddress,
  TAccountSigner,
  TAccountState,
  TAccountRentFund,
  TAccountUsedNonce,
  TAccountDepositorTokenAccount,
  TAccountBurnToken,
  TAccountDenylistAccount,
  TAccountTokenMessengerMinterSenderAuthority,
  TAccountMessageTransmitter,
  TAccountTokenMessenger,
  TAccountRemoteTokenMessenger,
  TAccountTokenMinter,
  TAccountLocalToken,
  TAccountCctpEventAuthority,
  TAccountMessageSentEventData,
  TAccountMessageTransmitterProgram,
  TAccountTokenMessengerMinterProgram,
  TAccountTokenProgram,
  TAccountSystemProgram,
  TAccountEventAuthority,
  TAccountProgram
> {
  const programAddress =
    (config?.programAddress as Address) ??
    SPONSORED_CCTP_SRC_PERIPHERY_PROGRAM_ADDRESS;

  const originalAccounts = {
    signer: { value: input.signer ?? null, isWritable: true },
    state: { value: input.state ?? null, isWritable: false },
    rentFund: { value: input.rentFund ?? null, isWritable: true },
    usedNonce: { value: input.usedNonce ?? null, isWritable: true },
    depositorTokenAccount: {
      value: input.depositorTokenAccount ?? null,
      isWritable: true,
    },
    burnToken: { value: input.burnToken ?? null, isWritable: true },
    denylistAccount: {
      value: input.denylistAccount ?? null,
      isWritable: false,
    },
    tokenMessengerMinterSenderAuthority: {
      value: input.tokenMessengerMinterSenderAuthority ?? null,
      isWritable: false,
    },
    messageTransmitter: {
      value: input.messageTransmitter ?? null,
      isWritable: true,
    },
    tokenMessenger: { value: input.tokenMessenger ?? null, isWritable: false },
    remoteTokenMessenger: {
      value: input.remoteTokenMessenger ?? null,
      isWritable: false,
    },
    tokenMinter: { value: input.tokenMinter ?? null, isWritable: false },
    localToken: { value: input.localToken ?? null, isWritable: true },
    cctpEventAuthority: {
      value: input.cctpEventAuthority ?? null,
      isWritable: false,
    },
    messageSentEventData: {
      value: input.messageSentEventData ?? null,
      isWritable: true,
    },
    messageTransmitterProgram: {
      value: input.messageTransmitterProgram ?? null,
      isWritable: false,
    },
    tokenMessengerMinterProgram: {
      value: input.tokenMessengerMinterProgram ?? null,
      isWritable: false,
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    eventAuthority: { value: input.eventAuthority ?? null, isWritable: false },
    program: { value: input.program ?? null, isWritable: false },
  };

  const accounts = originalAccounts;
  const args = { ...input };

  // Resolve default values
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value =
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address<TAccountTokenProgram>;
  }
  if (!accounts.messageTransmitterProgram.value) {
    accounts.messageTransmitterProgram.value =
      "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC" as Address<TAccountMessageTransmitterProgram>;
  }
  if (!accounts.tokenMessengerMinterProgram.value) {
    accounts.tokenMessengerMinterProgram.value =
      "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe" as Address<TAccountTokenMessengerMinterProgram>;
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value =
      "11111111111111111111111111111111" as Address<TAccountSystemProgram>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  const instruction = {
    accounts: [
      getAccountMeta(accounts.signer),
      getAccountMeta(accounts.state),
      getAccountMeta(accounts.rentFund),
      getAccountMeta(accounts.usedNonce),
      getAccountMeta(accounts.depositorTokenAccount),
      getAccountMeta(accounts.burnToken),
      getAccountMeta(accounts.denylistAccount),
      getAccountMeta(accounts.tokenMessengerMinterSenderAuthority),
      getAccountMeta(accounts.messageTransmitter),
      getAccountMeta(accounts.tokenMessenger),
      getAccountMeta(accounts.remoteTokenMessenger),
      getAccountMeta(accounts.tokenMinter),
      getAccountMeta(accounts.localToken),
      getAccountMeta(accounts.cctpEventAuthority),
      getAccountMeta(accounts.messageSentEventData),
      getAccountMeta(accounts.messageTransmitterProgram),
      getAccountMeta(accounts.tokenMessengerMinterProgram),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.eventAuthority),
      getAccountMeta(accounts.program),
    ].filter(
      (meta): meta is IAccountMeta | IAccountSignerMeta => meta !== undefined
    ),
    programAddress,
    data: getDepositForBurnInstructionDataEncoder().encode(args),
  };
  return instruction as DepositForBurnInstruction<
    TProgramAddress,
    TAccountSigner,
    TAccountState,
    TAccountRentFund,
    TAccountUsedNonce,
    TAccountDepositorTokenAccount,
    TAccountBurnToken,
    TAccountDenylistAccount,
    TAccountTokenMessengerMinterSenderAuthority,
    TAccountMessageTransmitter,
    TAccountTokenMessenger,
    TAccountRemoteTokenMessenger,
    TAccountTokenMinter,
    TAccountLocalToken,
    TAccountCctpEventAuthority,
    TAccountMessageSentEventData,
    TAccountMessageTransmitterProgram,
    TAccountTokenMessengerMinterProgram,
    TAccountTokenProgram,
    TAccountSystemProgram,
    TAccountEventAuthority,
    TAccountProgram
  >;
}

export function parseDepositForBurnInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedDepositForBurnInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 21) {
    throw new Error("Not enough accounts");
  }
  const accountMetas =
    instruction.accounts as unknown as readonly IAccountMeta[];
  return {
    programAddress: instruction.programAddress,
    accounts: {
      signer: accountMetas[0] as TAccountMetas[0],
      state: accountMetas[1] as TAccountMetas[1],
      rentFund: accountMetas[2] as TAccountMetas[2],
      usedNonce: accountMetas[3] as TAccountMetas[3],
      depositorTokenAccount: accountMetas[4] as TAccountMetas[4],
      burnToken: accountMetas[5] as TAccountMetas[5],
      denylistAccount: accountMetas[6] as TAccountMetas[6],
      tokenMessengerMinterSenderAuthority: accountMetas[7] as TAccountMetas[7],
      messageTransmitter: accountMetas[8] as TAccountMetas[8],
      tokenMessenger: accountMetas[9] as TAccountMetas[9],
      remoteTokenMessenger: accountMetas[10] as TAccountMetas[10],
      tokenMinter: accountMetas[11] as TAccountMetas[11],
      localToken: accountMetas[12] as TAccountMetas[12],
      cctpEventAuthority: accountMetas[13] as TAccountMetas[13],
      messageSentEventData: accountMetas[14] as TAccountMetas[14],
      messageTransmitterProgram: accountMetas[15] as TAccountMetas[15],
      tokenMessengerMinterProgram: accountMetas[16] as TAccountMetas[16],
      tokenProgram: accountMetas[17] as TAccountMetas[17],
      systemProgram: accountMetas[18] as TAccountMetas[18],
      eventAuthority: accountMetas[19] as TAccountMetas[19],
      program: accountMetas[20] as TAccountMetas[20],
    },
    data: getDepositForBurnInstructionDataDecoder().decode(instruction.data),
  };
}
