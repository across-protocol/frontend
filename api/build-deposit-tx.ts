import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { type, assert, Infer, optional, string, pattern } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  handleErrorCondition,
  parsableBigNumberString,
  validAddress,
  positiveIntStr,
  boolStr,
  getSpokePool,
  validAddressOrENS,
  tagDomain,
} from "./_utils";
import { InvalidParamError } from "./_errors";
import { getFillDeadline } from "./_fill-deadline";

const BuildDepositTxQueryParamsSchema = type({
  inputAmount: parsableBigNumberString(),
  outputAmount: parsableBigNumberString(),
  inputToken: validAddress(),
  outputToken: validAddress(),
  destinationChainId: positiveIntStr(),
  originChainId: positiveIntStr(),
  depositor: validAddress(),
  recipient: validAddress(),
  quoteTimestamp: positiveIntStr(),
  fillDeadline: optional(positiveIntStr()),
  exclusiveRelayer: optional(validAddressOrENS()),
  exclusivityParameter: optional(positiveIntStr()),
  message: optional(string()),
  isNative: optional(boolStr()),
  // A 4-byte hex string representing the domain identifier.
  // Optional: will be appended to the data field of the transaction.
  domainIdentifier: optional(pattern(string(), /^0x[0-9a-fA-F]{4}$/)),
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
      inputAmount: _inputAmount,
      outputAmount: _outputAmount,
      inputToken,
      outputToken,
      destinationChainId: destinationChainIdInput,
      originChainId: originChainIdInput,
      recipient,
      depositor,
      // Note, that the value of `quoteTimestamp` query param needs to be taken directly as returned by the
      // `GET /api/suggested-fees` endpoint. This is why we don't floor the timestamp value here.
      quoteTimestamp,
      fillDeadline: _fillDeadline,
      exclusiveRelayer = ethers.constants.AddressZero,
      exclusivityParameter = "0",
      message = "0x",
      isNative: isNativeBoolStr,
      domainIdentifier,
    } = query;

    recipient = ethers.utils.getAddress(recipient);
    depositor = ethers.utils.getAddress(depositor);
    inputToken = ethers.utils.getAddress(inputToken);
    outputToken = ethers.utils.getAddress(outputToken);
    const inputAmount = ethers.BigNumber.from(_inputAmount);
    const outputAmount = ethers.BigNumber.from(_outputAmount);
    const destinationChainId = parseInt(destinationChainIdInput);
    const originChainId = parseInt(originChainIdInput);
    const isNative = isNativeBoolStr === "true";
    const fillDeadline =
      _fillDeadline ?? (await getFillDeadline(destinationChainId));

    if (originChainId === destinationChainId) {
      throw new InvalidParamError({
        message: "Origin and destination chains cannot be the same",
      });
    }

    const spokePool = getSpokePool(originChainId);

    const value = isNative ? inputAmount : ethers.constants.Zero;
    const tx = await spokePool.populateTransaction.deposit(
      depositor,
      recipient,
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      destinationChainId,
      exclusiveRelayer,
      quoteTimestamp,
      fillDeadline,
      exclusivityParameter,
      message,
      { value }
    );

    // Tag the domain identifier to the data field of the transaction.
    tx.data = domainIdentifier
      ? tagDomain(tx.data!, domainIdentifier)
      : tx.data;

    const responseJson = {
      data: tx.data,
      value: tx.value?.toString(),
    };

    // Two different explanations for how `stale-while-revalidate` works:

    // https://vercel.com/docs/concepts/edge-network/caching#stale-while-revalidate
    // This tells our CDN the value is fresh for 10 seconds. If a request is repeated within the next 10 seconds,
    // the previously cached value is still fresh. The header x-vercel-cache present in the response will show the
    // value HIT. If the request is repeated between 1 and 20 seconds later, the cached value will be stale but
    // still render. In the background, a revalidation request will be made to populate the cache with a fresh value.
    // x-vercel-cache will have the value STALE until the cache is refreshed.

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    // The response is fresh for 150s. After 150s it becomes stale, but the cache is allowed to reuse it
    // for any requests that are made in the following 150s, provided that they revalidate the response in the background.
    // Revalidation will make the cache be fresh again, so it appears to clients that it was always fresh during
    // that period — effectively hiding the latency penalty of revalidation from them.
    // If no request happened during that period, the cache became stale and the next request will revalidate normally.
    logger.debug({
      at: "BuildDepositTx",
      message: "Response data",
      responseJson,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=150, stale-while-revalidate=150"
    );
    response.status(200).json(responseJson);
  } catch (error) {
    return handleErrorCondition("build-deposit-tx", response, logger, error);
  }
};

export default handler;
