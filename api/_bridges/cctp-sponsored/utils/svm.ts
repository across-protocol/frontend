import { ethers } from "ethers";
import {
  address,
  createNoopSigner,
  generateKeyPairSigner,
  getProgramDerivedAddress,
} from "@solana/kit";
import * as sdk from "@across-protocol/sdk";
import bs58 from "bs58";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import {
  getCctpMessageTransmitterAddress,
  getCctpTokenMessengerAddress,
} from "../../cctp/utils/constants";

export async function getDepositAccounts(params: {
  originChainId: number;
  depositor: string;
  destinationDomain: number;
  sponsoredCctpSrcPeripheryAddress: string;
  nonce: string;
  inputToken: string;
}) {
  const depositor = sdk.utils.toAddressType(
    params.depositor,
    params.originChainId
  );
  const depositorSigner = createNoopSigner(address(depositor.toBase58()));
  const tokenMessengerAddress = address(
    getCctpTokenMessengerAddress(params.originChainId)
  );
  const messageTransmitterAddress = address(
    getCctpMessageTransmitterAddress(params.originChainId)
  );
  const sponsoredCctpSrcPeripheryAddress = address(
    sdk.utils
      .toAddressType(
        params.sponsoredCctpSrcPeripheryAddress,
        params.originChainId
      )
      .toBase58()
  );
  const inputTokenAddress = sdk.utils.toAddressType(
    params.inputToken,
    params.originChainId
  );

  const [
    cctpAccounts,
    [denylistAddress],
    [stateAddress],
    [rentFundAddress],
    [usedNonceAddress],
    depositorTokenAccountAddress,
    messageSentEventDataKeypair,
  ] = await Promise.all([
    sdk.arch.svm.getCCTPDepositAccounts(
      params.originChainId,
      params.destinationDomain,
      tokenMessengerAddress,
      messageTransmitterAddress
    ),
    getProgramDerivedAddress({
      programAddress: tokenMessengerAddress,
      seeds: ["denylist_account", bs58.decode(depositor.toBase58())],
    }),
    getProgramDerivedAddress({
      programAddress: sponsoredCctpSrcPeripheryAddress,
      seeds: ["state"],
    }),
    getProgramDerivedAddress({
      programAddress: sponsoredCctpSrcPeripheryAddress,
      seeds: ["rent_fund"],
    }),
    getProgramDerivedAddress({
      programAddress: sponsoredCctpSrcPeripheryAddress,
      seeds: ["used_nonce", ethers.utils.arrayify(params.nonce)],
    }),
    sdk.arch.svm.getAssociatedTokenAddress(
      depositor.forceSvmAddress(),
      inputTokenAddress.forceSvmAddress()
    ),
    generateKeyPairSigner(),
  ]);

  return {
    signer: depositorSigner,
    payer: depositorSigner,
    state: stateAddress,
    rentFund: rentFundAddress,
    usedNonce: usedNonceAddress,
    depositorTokenAccount: depositorTokenAccountAddress,
    burnToken: address(inputTokenAddress.toBase58()),
    denylistAccount: denylistAddress,
    tokenMessengerMinterSenderAuthority:
      cctpAccounts.tokenMessengerMinterSenderAuthority,
    messageTransmitter: cctpAccounts.messageTransmitter,
    tokenMessenger: cctpAccounts.tokenMessenger,
    remoteTokenMessenger: cctpAccounts.remoteTokenMessenger,
    tokenMinter: cctpAccounts.tokenMinter,
    localToken: cctpAccounts.localToken,
    cctpEventAuthority: cctpAccounts.cctpEventAuthority,
    tokenProgram: address(TOKEN_PROGRAM_ID.toBase58()),
    messageSentEventData: messageSentEventDataKeypair,
    program: sponsoredCctpSrcPeripheryAddress,
  };
}
