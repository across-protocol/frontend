import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { type, assert, Infer, optional, string } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  InputError,
  handleErrorCondition,
  parsableBigNumberString,
  validAddress,
  positiveIntStr,
  boolStr,
  getSpokePool,
  tagReferrer,
} from "./_utils";

const BuildDepositTxQueryParamsSchema = type({
  amount: parsableBigNumberString(),
  token: validAddress(),
  isNative: boolStr(),
  destinationChainId: positiveIntStr(),
  originChainId: positiveIntStr(),
  recipient: validAddress(),
  relayerFeePct: parsableBigNumberString(),
  quoteTimestamp: positiveIntStr(),
  message: optional(string()),
  maxCount: optional(boolStr()),
  referrer: optional(validAddress()),
});

type BuildDepositTxQueryParams = Infer<typeof BuildDepositTxQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<BuildDepositTxQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "BuildDepositTx",
    message: "Query data",
    query,
  });
  try {
    assert(query, BuildDepositTxQueryParamsSchema);

    let {
      amount: amountInput,
      token,
      destinationChainId: destinationChainIdInput,
      originChainId: originChainIdInput,
      recipient,
      relayerFeePct: relayerFeePctInput,
      quoteTimestamp,
      message = "0x",
      maxCount = ethers.constants.MaxUint256.toString(),
      referrer,
    } = query;

    recipient = ethers.utils.getAddress(recipient);
    token = ethers.utils.getAddress(token);
    const destinationChainId = parseInt(destinationChainIdInput);
    const originChainId = parseInt(originChainIdInput);
    const amount = ethers.BigNumber.from(amountInput);
    const relayerFeePct = ethers.BigNumber.from(relayerFeePctInput);

    if (originChainId === destinationChainId) {
      throw new InputError("Origin and destination chains cannot be the same");
    }

    const spokePool = getSpokePool(originChainId);

    const value =
      token === ethers.constants.AddressZero ? amount : ethers.constants.Zero;
    const tx = await spokePool.populateTransaction.deposit(
      recipient,
      token,
      amount,
      destinationChainId,
      relayerFeePct,
      quoteTimestamp,
      message,
      maxCount,
      { value }
    );

    // do not tag a referrer if data is not provided as a hex string.
    tx.data =
      referrer && ethers.utils.isAddress(referrer)
        ? tagReferrer(tx.data!, referrer)
        : tx.data;

    const responseJson = {
      data: tx.data,
      value: tx.value?.toString(),
    };

    logger.debug({
      at: "BuildDepositTx",
      message: "Response data",
      responseJson,
    });

    response.status(200).json(responseJson);
  } catch (error) {
    return handleErrorCondition("build-deposit-tx", response, logger, error);
  }
};

export default handler;
