import * as sdk from "@across-protocol/sdk";
import acrossDeployments from "@across-protocol/contracts/dist/deployments/deployments.json";
import { BigNumber, ethers } from "ethers";

import { InvalidParamError } from "./_errors";
import { buildInternalCacheKey, makeCacheGetterAndSetter } from "./_cache";
import { getProvider } from "./_providers";
import { getCachedTokenBalance } from "./_balance";

// Vercel imposes a 14KB URL length limit (https://vercel.com/docs/errors/URL_TOO_LONG)
// We use a POST request to avoid this limit if message is too long.
export const MAX_MESSAGE_LENGTH = 25_000; // ~14KB

export function isMessageTooLong(message: string) {
  return message && message.length > MAX_MESSAGE_LENGTH;
}

export async function validateDepositMessage(params: {
  recipient: string;
  destinationChainId: number;
  relayer: string;
  outputTokenAddress: string;
  amountInput: BigNumber;
  message: string;
}) {
  const {
    recipient,
    destinationChainId,
    relayer,
    outputTokenAddress,
    amountInput,
    message,
  } = params;

  if (!sdk.utils.isMessageEmpty(message)) {
    if (!ethers.utils.isHexString(message)) {
      throw new InvalidParamError({
        message: "Message must be a hex string",
        param: "message",
      });
    }
    if (message.length % 2 !== 0) {
      // Our message encoding is a hex string, so we need to check that the length is even.
      throw new InvalidParamError({
        message: "Message must be an even hex string",
        param: "message",
      });
    }

    const isRecipientAContract =
      getStaticIsContract(destinationChainId, recipient) ||
      (await isContractCache(destinationChainId, recipient).get());

    if (!isRecipientAContract) {
      // If the message is a gas forwarding message to SVM, we allow it.
      if (
        sdk.utils.chainIsSvm(destinationChainId) &&
        isGasForwardingMessageToSvm(message)
      ) {
        return;
      }

      throw new InvalidParamError({
        message: "Recipient must be a contract when a message is provided",
        param: "recipient",
      });
    } else {
      // If we're in this case, it's likely that we're going to have to simulate the execution of
      // a complex message handling from the specified relayer to the specified recipient by calling
      // the arbitrary function call `handleAcrossMessage` at the recipient. So that we can discern
      // the difference between an OUT_OF_FUNDS error in either the transfer or through the execution
      // of the `handleAcrossMessage` we will check that the balance of the relayer is sufficient to
      // support this deposit.
      const balanceOfToken = await getCachedTokenBalance(
        destinationChainId,
        relayer,
        outputTokenAddress
      );
      if (balanceOfToken.lt(amountInput)) {
        throw new InvalidParamError({
          message:
            `Relayer Address (${relayer}) doesn't have enough funds to support this deposit;` +
            ` for help, please reach out to https://discord.across.to`,
          param: "relayer",
        });
      }
    }
  }
}

function isGasForwardingMessageToSvm(_message: string) {
  const message = new Uint8Array(
    Buffer.from(_message.startsWith("0x") ? _message.slice(2) : _message, "hex")
  );
  const decoder = sdk.arch.svm.getAcrossPlusMessageDecoder();
  const decoded = decoder.decode(message);

  // Heuristic to check if the message is a gas forwarding message to SVM:

  // - Check that handler_message is empty (0x00000000)
  const isEmptyHandlerMessage =
    decoded.handler_message.length === 4 &&
    Buffer.from(decoded.handler_message).toString("hex") === "00000000";

  // - Check that there's exactly 1 account (the recipient of value_amount)
  const hasSingleAccount = decoded.accounts.length === 1;

  // - Check that valueAmount is greater than 0
  const hasPositiveValue = decoded.value_amount > 0n;

  return isEmptyHandlerMessage && hasSingleAccount && hasPositiveValue;
}

function getStaticIsContract(chainId: number, address: string) {
  const addressType = sdk.utils.toAddressType(address, chainId);
  let comparableAddress = address;

  if (sdk.utils.chainIsSvm(chainId)) {
    try {
      comparableAddress = addressType.toBase58();
    } catch (error) {
      // noop
    }
  } else {
    if (addressType.isEVM()) {
      comparableAddress = addressType.toEvmAddress();
    }
  }

  const deployedAcrossContract = Object.values(
    (
      acrossDeployments as {
        [chainId: number]: {
          [contractName: string]: {
            address: string;
          };
        };
      }
    )[chainId]
  ).find(
    (contract) =>
      contract.address.toLowerCase() === comparableAddress.toLowerCase()
  );
  return !!deployedAcrossContract;
}

function isContractCache(chainId: number, address: string) {
  return makeCacheGetterAndSetter(
    buildInternalCacheKey("isContract", chainId, address),
    5 * 24 * 60 * 60, // 5 days - we can cache this for a long time
    async () => {
      if (sdk.utils.chainIsSvm(chainId)) {
        return false;
      }
      const addressType = sdk.utils.toAddressType(address, chainId);
      const isDeployed = await sdk.utils.isContractDeployedToAddress(
        addressType.toEvmAddress(),
        getProvider(chainId)
      );
      return isDeployed;
    }
  );
}
