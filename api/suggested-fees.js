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
} = require("./_utils");

const handler = async (request, response) => {
  try {
    const provider = infuraProvider("mainnet");

    let { amount, token, timestamp, destinationChainId, originChainId } =
      request.query;
    if (!isString(amount) || !isString(token) || !isString(destinationChainId))
      throw new InputError(
        "Must provide amount, token, and destinationChainId as query params"
      );

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

    const blockFinder = new BlockFinder(provider.getBlock.bind(provider));
    const [{ number: blockTag }, routeEnabled] = await Promise.all([
      blockFinder.getBlockForTimestamp(parsedTimestamp),
      isRouteEnabled(computedOriginChainId, destinationChainId, token),
    ]);

    if (!routeEnabled || disabledL1Tokens.includes(l1Token.toLowerCase()))
      throw new Error(
        `Route from chainId ${computedOriginChainId} to chainId ${destinationChainId} with origin token address ${token} is not enabled.`
      );

    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      "0x3B03509645713718B78951126E0A6de6f10043f5",
      provider
    );

    const [currentUt, nextUt, rateModel] = await Promise.all([
      hubPool.callStatic.liquidityUtilizationCurrent(l1Token, {
        blockTag,
      }),
      hubPool.callStatic.liquidityUtilizationPostRelay(l1Token, amount, {
        blockTag,
      }),
      configStoreClient.getRateModel(l1Token, {
        blockTag,
      }),
    ]);

    const realizedLPFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );
    const relayerFeeDetails = await getRelayerFeeDetails(
      l1Token,
      amount,
      destinationChainId
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
    let status;
    if (error instanceof InputError) {
      status = 400;
    } else {
      status = 500;
    }
    response.status(status).send(error.message);
  }
};

module.exports = handler;
