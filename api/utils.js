const { HubPool__factory } = require("@across-protocol/contracts-v2");
const sdk = require("@across-protocol/sdk-v2");
const ethers = require("ethers");

const { REACT_APP_PUBLIC_INFURA_ID } = process.env;

const getTokenDetails = async (provider, l1Token, l2Token, chainId) => {
  const hubPool = HubPool__factory.connect(
    "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
    provider
  );

  // 2 queries: treating the token as the l1Token or treating the token as the L2 token.
  const l2TokenFilter = hubPool.filters.SetPoolRebalanceRoute(
    undefined,
    l1Token,
    l2Token
  );

  // Filter events by chainId.
  const events = (await hubPool.queryFilter(l2TokenFilter, 0, "latest")).filter(
    (event) => !chainId || event.args.destinationChainId.toString() === chainId
  );

  if (events.length === 0) throw new InputError("No whitelisted token found");

  // Sorting from most recent to oldest.
  events.sort((a, b) => {
    if (b.blockNumber !== a.blockNumber) return b.blockNumber - a.blockNumber;
    if (b.transactionIndex !== a.transactionIndex)
      return b.transactionIndex - a.transactionIndex;
    return b.logIndex - a.logIndex;
  });

  const event = events[0];

  return {
    hubPool,
    chainId: event.args.destinationChainId.toNumber(),
    l1Token: event.args.l1Token,
    l2Token: event.args.l2Token,
  };
};

const isString = (input) => typeof input === "string";

class InputError extends Error {}

const infuraProvider = (name) =>
  new ethers.providers.StaticJsonRpcProvider(
    `https://${name}.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`
  );

const bobaProvider = () =>
  new ethers.providers.StaticJsonRpcProvider("https://mainnet.boba.network");

const queries = {
  1: () =>
    new sdk.relayFeeCalculator.EthereumQueries(infuraProvider("mainnet")),
  10: () =>
    new sdk.relayFeeCalculator.OptimismQueries(
      infuraProvider("optimism-mainnet")
    ),
  137: () =>
    new sdk.relayFeeCalculator.PolygonQueries(
      infuraProvider("polygon-mainnet")
    ),
  288: () => new sdk.relayFeeCalculator.BobaQueries(bobaProvider()),
  42161: () =>
    new sdk.relayFeeCalculator.ArbitrumQueries(
      infuraProvider("arbitrum-mainnet")
    ),
};

const maxRelayFeePct = 0.25;

const getRelayerFeeDetails = (l1Token, amount, destinationChainId) => {
  const tokenSymbol = Object.entries(sdk.relayFeeCalculator.SymbolMapping).find(
    ([symbol, { address }]) => address.toLowerCase() === l1Token.toLowerCase()
  )[0];
  const relayFeeCalculator = new sdk.relayFeeCalculator.RelayFeeCalculator({
    feeLimitPercent: maxRelayFeePct * 100,
    capitalCostsPercent: 0.04,
    queries: queries[destinationChainId](),
  });
  return relayFeeCalculator.relayerFeeDetails(amount, tokenSymbol);
};

module.exports = {
  getTokenDetails,
  isString,
  InputError,
  queries,
  infuraProvider,
  bobaProvider,
  getRelayerFeeDetails,
  maxRelayFeePct,
};
