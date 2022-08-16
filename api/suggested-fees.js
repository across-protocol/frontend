// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

const sdk = require("@across-protocol/sdk-v2");
const { BlockFinder } = require("@uma/sdk");
const ethers = require("ethers");
const { BLOCK_TAG_LAG } = require("./_constants");
const {
  getLogger,
  getTokenDetails,
  InputError,
  isString,
  infuraProvider,
  getRelayerFeeDetails,
  isRouteEnabled,
  disabledL1Tokens,
  getCachedTokenPrice,
} = require("./_utils");

const handler = async (request, response) => {
  const logger = getLogger();
  try {
    const provider = infuraProvider("mainnet");

    let { amount, token, timestamp, destinationChainId, originChainId } =
      request.query;
    if (!isString(amount) || !isString(token) || !isString(destinationChainId))
      throw new InputError(
        "Must provide amount, token, and destinationChainId as query params"
      );
    if (originChainId === destinationChainId) {
      throw new InputError("Origin and destination chains cannot be the same");
    }

    const amountAsValue = Number(amount);
    if (Number.isNaN(amountAsValue) || amountAsValue === 0) {
      throw new InputError("Value provided in amount parameter is not valid.");
    }

    token = ethers.utils.getAddress(token);

    const parsedTimestamp = isString(timestamp)
      ? Number(timestamp)
      : (await provider.getBlock("latest")).timestamp;

    amount = ethers.BigNumber.from(amount);

    let {
      l1Token,
      hubPool,
      chainId: computedOriginChainId,
    } = await getTokenDetails(
      provider,
      undefined, // Search by l2Token only.
      token,
      originChainId
    );

    logger.debug({
      at: "suggested-fees",
      message: "Checking route",
      computedOriginChainId,
      destinationChainId,
      token,
    });
    const blockFinder = new BlockFinder(provider.getBlock.bind(provider));
    const [{ number: latestBlock }, routeEnabled] = await Promise.all([
      blockFinder.getBlockForTimestamp(parsedTimestamp),
      isRouteEnabled(computedOriginChainId, destinationChainId, token),
    ]);

    // If the query was supplied a timestamp, lets use the most
    // recent block before the timestamp. If the timestamp is
    // not specified, we can use the default variant of blockTag
    // to be "latest"
    const blockTag = isString(timestamp) ? latestBlock : BLOCK_TAG_LAG;

    logger.debug({ at: "suggested-fees", message: `Using block ${blockTag}` });

    if (!routeEnabled || disabledL1Tokens.includes(l1Token.toLowerCase()))
      throw new InputError(
        `Route from chainId ${computedOriginChainId} to chainId ${destinationChainId} with origin token address ${token} is not enabled.`
      );

    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      "0x3B03509645713718B78951126E0A6de6f10043f5",
      provider
    );

    const [currentUt, nextUt, rateModel, tokenPrice] = await Promise.all([
      hubPool.callStatic.liquidityUtilizationCurrent(l1Token, {
        blockTag,
      }),
      hubPool.callStatic.liquidityUtilizationPostRelay(l1Token, amount, {
        blockTag,
      }),
      configStoreClient.getRateModel(l1Token, {
        blockTag,
      }),
      getCachedTokenPrice(l1Token),
    ]);
    logger.debug({
      at: "suggested-fees",
      message: "Fetched utilization",
      currentUt,
      nextUt,
      rateModel,
    });

    const realizedLPFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );
    logger.debug({
      at: "suggested-fees",
      message: "Calculated realizedLPFeePct",
      realizedLPFeePct,
    });
    logger.debug({
      at: "suggested-fees",
      message: "Got token price from /coingecko",
      tokenPrice,
    });

    const relayerFeeDetails = await getRelayerFeeDetails(
      l1Token,
      amount,
      destinationChainId,
      tokenPrice
    );
    logger.debug({
      at: "suggested-fees",
      message: "Calculated relayerFeeDetails",
      relayerFeeDetails,
    });

    if (relayerFeeDetails.isAmountTooLow)
      throw new InputError("Sent amount is too low relative to fees");

    const responseJson = {
      relayFeePct: relayerFeeDetails.relayFeePercent,
      lpFeePct: realizedLPFeePct.toString(),
      timestamp: parsedTimestamp.toString(),
    };

    response.status(200).json(responseJson);
  } catch (error) {
    let status;
    if (error instanceof InputError) {
      logger.warn({ at: "suggested-fees", message: "400 input error", error });
      status = 400;
    } else {
      logger.error({
        at: "suggested-fees",
        message: "500 server error",
        error,
      });
      status = 500;
    }
    response.status(status).send(error.message);
  }
};

module.exports = handler;
