// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

const sdk = require("@across-protocol/sdk-v2");
const ethers = require("ethers");
const { HubPool__factory } = require("@across-protocol/contracts-v2");

const {
  InputError,
  isString,
  infuraProvider,
  getRelayerFeeDetails,
  findRoute,
} = require("./_utils");

const handler = async (request, response) => {
  try {
    const provider = infuraProvider("mainnet");

    let { amount, token, destinationChainId, originChainId } = request.query;
    if (!isString(amount) || !isString(token) || !isString(destinationChainId))
      throw new InputError(
        "Must provide amount, token, and destinationChainId as query params"
      );

    token = ethers.utils.getAddress(token);

    amount = ethers.BigNumber.from(amount);

    const route = findRoute(
      token,
      parseInt(destinationChainId),
      originChainId && parseInt(originChainId)
    );

    if (!route) throw new Error(`Route not enabled.`);

    const hubPool = HubPool__factory.connect(
      "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
      provider
    );

    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      "0x3B03509645713718B78951126E0A6de6f10043f5",
      provider
    );

    const { l1TokenAddress: l1Token } = route;

    const [currentUt, nextUt, rateModel, relayerFeeDetails, latestBlock] =
      await Promise.all([
        hubPool.callStatic.liquidityUtilizationCurrent(l1Token),
        hubPool.callStatic.liquidityUtilizationPostRelay(l1Token, amount),
        configStoreClient.getRateModel(l1Token),
        getRelayerFeeDetails(l1Token, amount, destinationChainId),
        provider.getBlock("latest"),
      ]);

    const realizedLPFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );

    if (relayerFeeDetails.isAmountTooLow)
      throw new InputError("Sent amount is too low relative to fees");

    const responseJson = {
      relayFeePct: relayerFeeDetails.relayFeePercent,
      lpFeePct: realizedLPFeePct.toString(),
      timestamp: latestBlock.timestamp,
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
