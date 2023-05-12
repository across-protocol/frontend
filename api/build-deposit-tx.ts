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
  validAddressOrENS,
} from "./_utils";

const BuildDepositTxQueryParamsSchema = type({
  amount: parsableBigNumberString(),
  token: validAddress(),
  destinationChainId: positiveIntStr(),
  originChainId: positiveIntStr(),
  recipient: validAddress(),
  relayerFeePct: parsableBigNumberString(),
  quoteTimestamp: positiveIntStr(),
  message: optional(string()),
  maxCount: optional(boolStr()),
  referrer: optional(validAddressOrENS()),
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
      // Note, that the value of `quoteTimestamp` query param needs to be taken directly as returned by the
      // `GET /api/suggested-fees` endpoint. This is why we don't floor the timestamp value here.
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
    tx.data = referrer ? await tagReferrer(tx.data!, referrer) : tx.data;

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
