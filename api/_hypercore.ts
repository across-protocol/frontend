import { BigNumber, ethers } from "ethers";

import { getProvider } from "./_providers";
import { CHAIN_IDs } from "./_constants";

// Contract used to query Hypercore balances from EVM
export const CORE_BALANCE_SYSTEM_PRECOMPILE =
  "0x0000000000000000000000000000000000000801";

// CoreWriter contract on EVM that can be used to interact with Hypercore.
export const CORE_WRITER_EVM_ADDRESS =
  "0x3333333333333333333333333333333333333333";

// CoreWriter exposes a single function that charges 20k gas to send an instruction on Hypercore.
export const CORE_WRITER_ABI = ["function sendRawAction(bytes)"];

// To transfer Core balance, a 'spotSend' action must be specified in the payload to sendRawAction:
export const SPOT_SEND_PREFIX_BYTES = ethers.utils.hexlify([
  1, // byte 0: version, must be 1
  // bytes 1-3: unique action index as described here:
  // https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore#corewriter-contract
  0,
  0,
  6, // action index of spotSend is 6, so bytes 1-3 are 006
]);

export function encodeTransferOnCoreCalldata(params: {
  recipientAddress: string;
  tokenSystemAddress: string;
  amount: BigNumber;
}) {
  const { recipientAddress, tokenSystemAddress, amount } = params;
  return encodeSendRawActionCalldata(
    getSpotSendBytesForTransferOnCore({
      recipientAddress,
      tokenSystemAddress,
      amount,
    })
  );
}

export function encodeSendRawActionCalldata(action: string) {
  const coreWriter = new ethers.Contract(
    CORE_WRITER_EVM_ADDRESS,
    CORE_WRITER_ABI
  );
  console.log("action", coreWriter.interface);
  return coreWriter.interface.encodeFunctionData("sendRawAction", [action]);
}

export function getSpotSendBytesForTransferOnCore(params: {
  recipientAddress: string;
  tokenSystemAddress: string;
  amount: BigNumber;
}) {
  const { recipientAddress, tokenSystemAddress, amount } = params;
  const tokenIndex = parseInt(tokenSystemAddress.replace("0x20", ""), 16);
  console.log("tokenIndex", tokenIndex);
  console.log("recipientAddress", recipientAddress);
  console.log("amount", amount.toString());
  const transferOnCoreCalldata = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint64", "uint64"],
    [recipientAddress, tokenIndex, amount]
  );
  return ethers.utils.hexlify(
    ethers.utils.concat([SPOT_SEND_PREFIX_BYTES, transferOnCoreCalldata])
  );
}

export async function getBalanceOnHyperCore(params: {
  account: string;
  tokenSystemAddress: string;
}) {
  const provider = getProvider(CHAIN_IDs.HYPERCORE);
  const tokenIndex = parseInt(
    params.tokenSystemAddress.replace("0x20", ""),
    16
  );
  const balanceCoreCalldata = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint64"],
    [params.account, tokenIndex]
  );
  const queryResult = await provider.call({
    to: CORE_BALANCE_SYSTEM_PRECOMPILE,
    data: balanceCoreCalldata,
  });
  const decodedQueryResult = ethers.utils.defaultAbiCoder.decode(
    ["uint64", "uint64", "uint64"], // total, hold, entryNtl
    queryResult
  );
  return BigNumber.from(decodedQueryResult[0].toString());
}
