// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

const sdk = require("@across-protocol/sdk-v2");
const { BlockFinder } = require("@uma/sdk");
const ethers = require("ethers");

const {
  getTokenDetails,
  InputError,
  isString,
  infuraProvider,
  getRelayerFeeDetails,
  isRouteEnabled,
  disabledL1Tokens,
  getTokenPriceFromOwnFunction,
} = require("./_utils");

const handler = async (request, response) => {
  console.log(
    `INFO(suggested-fees): Handling request to /suggested-fees`,
    request
  );
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

    console.log(
      `INFO(suggested-fees): Checking route from chain ${computedOriginChainId} to ${destinationChainId} for token ${token}`
    );
    const blockFinder = new BlockFinder(provider.getBlock.bind(provider));
    const [{ number: blockTag }, routeEnabled] = await Promise.all([
      blockFinder.getBlockForTimestamp(parsedTimestamp),
      isRouteEnabled(computedOriginChainId, destinationChainId, token),
    ]);
    console.log(`INFO(suggested-fees): Using block ${blockTag}`);

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
      getTokenPriceFromOwnFunction(l1Token),
    ]);
    console.log(
      `INFO(suggested-fees): Fetched current utilization ${currentUt}, post relay utilization ${nextUt}, rate model ${rateModel}`
    );

    const realizedLPFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );
    console.log(
      `INFO(suggested-fees): Calculated realizedLPFeePct ${realizedLPFeePct}`
    );

    if (tokenPrice !== undefined)
      console.log(
        `INFO(limits): Got token price from${`https://across.to/api/coingecko`}: ${tokenPrice}`
      );

    const relayerFeeDetails = await getRelayerFeeDetails(
      l1Token,
      amount,
      destinationChainId,
      tokenPrice
    );
    console.log(
      `INFO(suggested-fees): Calculated relayerFeeDetails ${relayerFeeDetails}`
    );

    if (relayerFeeDetails.isAmountTooLow)
      throw new InputError("Sent amount is too low relative to fees");

    const responseJson = {
      relayFeePct: relayerFeeDetails.relayFeePercent,
      lpFeePct: realizedLPFeePct.toString(),
      timestamp: parsedTimestamp.toString(),
    };

    response.status(200).json(responseJson);
  } catch (error) {
    console.log(`ERROR(suggested-fees): Error found ${error}`);
    let status;
    if (error instanceof InputError) {
      console.warn(`ERROR(suggested-fees): 400 input error: ${error}`);
      status = 400;
    } else {
      console.error(`ERROR(suggested-fees): 500 server error: ${error}`);
      status = 500;
    }
    response.status(status).send(error.message);
  }
};

module.exports = handler;
