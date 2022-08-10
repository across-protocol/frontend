const {
  HubPool__factory,
  ERC20__factory,
  SpokePool__factory,
} = require("@across-protocol/contracts-v2");
const sdk = require("@across-protocol/sdk-v2");
const ethers = require("ethers");
const axios = require("axios");

const { REACT_APP_PUBLIC_INFURA_ID, REACT_APP_COINGECKO_PRO_API_KEY } =
  process.env;
const {
  relayerFeeCapitalCostConfig,
  disabledL1Tokens,
} = require("./_constants");

const getTokenDetails = async (provider, l1Token, l2Token, chainId) => {
  const hubPool = HubPool__factory.connect(
    "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
    provider
  );
  console.log(
    `INFO: Fetching token details for ${l1Token} ${l2Token} on chain ${chainId}`
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
  console.log(`INFO: Found pool rebalance route event ${event}`);

  return {
    hubPool,
    chainId: event.args.destinationChainId.toNumber(),
    l1Token: event.args.l1Token,
    l2Token: event.args.destinationToken,
  };
};

const isString = (input) => typeof input === "string";

class InputError extends Error {}

const infuraProvider = (name) => {
  const url = `https://${name}.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`;
  console.log(`INFO: Using infura provider at ${url}`);
  return new ethers.providers.StaticJsonRpcProvider(url);
};

const bobaProvider = () =>
  new ethers.providers.StaticJsonRpcProvider("https://mainnet.boba.network");

const makeHubPoolClientConfig = () => {
  return {
    chainId: 1,
    hubPoolAddress: "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    configStoreAddress: "0x3B03509645713718B78951126E0A6de6f10043f5",
  };
};

const getHubPoolClient = () => {
  const hubPoolConfig = makeHubPoolClientConfig();
  return new sdk.pool.Client(
    hubPoolConfig,
    {
      provider: infuraProvider("mainnet"),
    },
    (_, __) => {} // Dummy function that does nothing and is needed to construct this client.
  );
};

// Note: this address is used as the from address for simulated relay transactions on Optimism and Arbitrum since
// gas estimates require a live estimate and not a pre-configured gas amount. This address should be pre-loaded with
// a USDC approval for the _current_ spoke pools on Optimism (0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9) and Arbitrum
// (0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C). It also has a small amount of USDC ($0.10) used for estimations.
// If this address lacks either of these, estimations will fail and relays to optimism and arbitrum will hang when
// estimating gas. Defaults to 0x893d0d70ad97717052e3aa8903d9615804167759 so the app can technically run without this.
const dummyFromAddress =
  process.env.REACT_APP_DUMMY_FROM_ADDRESS ||
  "0x893d0d70ad97717052e3aa8903d9615804167759";

const queries = {
  1: () =>
    new sdk.relayFeeCalculator.EthereumQueries(
      infuraProvider("mainnet"),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY
    ),
  10: () =>
    new sdk.relayFeeCalculator.OptimismQueries(
      infuraProvider("optimism-mainnet"),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY
    ),
  137: () =>
    new sdk.relayFeeCalculator.PolygonQueries(
      infuraProvider("polygon-mainnet"),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY
    ),
  288: () =>
    new sdk.relayFeeCalculator.BobaQueries(
      bobaProvider(),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY
    ),
  42161: () =>
    new sdk.relayFeeCalculator.ArbitrumQueries(
      infuraProvider("arbitrum-mainnet"),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY
    ),
};

const maxRelayFeePct = 0.25;

const getRelayerFeeCalculator = (destinationChainId) => {
  const relayerFeeCalculatorConfig = {
    feeLimitPercent: maxRelayFeePct * 100,
    capitalCostsPercent: 0.04,
    queries: queries[destinationChainId](),
    capitalCostsConfig: relayerFeeCapitalCostConfig,
  };
  console.log(
    `INFO(getRelayerFeeDetails): relayer fee calculator config ${relayerFeeCalculatorConfig}`
  );
  return new sdk.relayFeeCalculator.RelayFeeCalculator(
    relayerFeeCalculatorConfig
  );
};
const getTokenSymbol = (tokenAddress) => {
  return Object.entries(sdk.relayFeeCalculator.SymbolMapping).find(
    ([_symbol, { address }]) =>
      address.toLowerCase() === tokenAddress.toLowerCase()
  )[0];
};
const getRelayerFeeDetails = (
  l1Token,
  amount,
  destinationChainId,
  tokenPrice
) => {
  const tokenSymbol = getTokenSymbol(l1Token);
  console.log(`INFO(getRelayerFeeDetails): Token symbol ${tokenSymbol}`);
  const relayFeeCalculator = getRelayerFeeCalculator(destinationChainId);
  return relayFeeCalculator.relayerFeeDetails(amount, tokenSymbol, tokenPrice);
};

const getTokenPrice = (l1Token, destinationChainId) => {
  const tokenSymbol = getTokenSymbol(l1Token);
  console.log(`INFO(getTokenPrice): Token symbol ${tokenSymbol}`);
  const relayFeeCalculator = getRelayerFeeCalculator(destinationChainId);
  return relayFeeCalculator.getTokenPrice(tokenSymbol);
};

const getTokenPriceFromOwnFunction = async (l1Token) => {
  return Number(
    (await axios(`https://across.to/api/coingecko`, { params: { l1Token } }))
      .data.price
  );
};

const providerCache = {};

const getProvider = (_chainId) => {
  const chainId = _chainId.toString();
  if (!providerCache[chainId]) {
    switch (chainId.toString()) {
      case "1":
        providerCache[chainId] = infuraProvider("mainnet");
        break;
      case "10":
        providerCache[chainId] = infuraProvider("optimism-mainnet");
        break;
      case "137":
        providerCache[chainId] = infuraProvider("polygon-mainnet");
        break;
      case "288":
        providerCache[chainId] = bobaProvider();
        break;
      case "42161":
        providerCache[chainId] = infuraProvider("arbitrum-mainnet");
        break;
      default:
        throw new Error(`Invalid chainId provided: ${chainId}`);
    }
  }
  return providerCache[chainId];
};

const getSpokePool = (_chainId) => {
  const chainId = _chainId.toString();
  const provider = getProvider(chainId);
  switch (chainId.toString()) {
    case "1":
      return SpokePool__factory.connect(
        "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381",
        provider
      );
    case "10":
      return SpokePool__factory.connect(
        "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9",
        provider
      );
    case "137":
      return SpokePool__factory.connect(
        "0x69B5c72837769eF1e7C164Abc6515DcFf217F920",
        provider
      );
    case "288":
      return SpokePool__factory.connect(
        "0xBbc6009fEfFc27ce705322832Cb2068F8C1e0A58",
        provider
      );
    case "42161":
      return SpokePool__factory.connect(
        "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C",
        provider
      );
    default:
      throw new Error(`Invalid chainId provided: ${chainId}`);
  }
};

const isRouteEnabled = (fromChainId, toChainId, fromToken) => {
  const spokePool = getSpokePool(fromChainId.toString());
  return spokePool.enabledDepositRoutes(fromToken, toChainId.toString());
};

const getBalance = (chainId, token, account) => {
  return ERC20__factory.connect(token, getProvider(chainId)).balanceOf(account);
};

const maxBN = (...arr) => {
  return [...arr].sort((a, b) => {
    if (b.gt(a)) return 1;
    if (a.gt(b)) return -1;
    return 0;
  })[0];
};

const minBN = (...arr) => {
  return [...arr].sort((a, b) => {
    if (a.gt(b)) return 1;
    if (b.gt(a)) return -1;
    return 0;
  })[0];
};

module.exports = {
  getTokenDetails,
  isString,
  InputError,
  queries,
  infuraProvider,
  bobaProvider,
  getRelayerFeeDetails,
  getTokenPrice,
  getTokenPriceFromOwnFunction,
  maxRelayFeePct,
  getProvider,
  getBalance,
  maxBN,
  minBN,
  isRouteEnabled,
  getHubPoolClient,
  dummyFromAddress,
  disabledL1Tokens,
};
