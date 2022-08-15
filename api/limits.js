// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

const { HubPool__factory } = require("@across-protocol/contracts-v2");
const ethers = require("ethers");

const {
  InputError,
  isString,
  getRelayerFeeDetails,
  maxRelayFeePct,
  getTokenDetails,
  getBalance,
  maxBN,
  minBN,
  isRouteEnabled,
  disabledL1Tokens,
} = require("./_utils");

const handler = async (request, response) => {
  console.log(`INFO(limits): Handling request to /limits ${request}`);

  try {
    const {
      REACT_APP_PUBLIC_INFURA_ID,
      REACT_APP_FULL_RELAYERS, // These are relayers running a full auto-rebalancing strategy.
      REACT_APP_TRANSFER_RESTRICTED_RELAYERS, // These are relayers whose funds stay put.
      REACT_APP_USDC_LP_CUSHION,
      REACT_APP_WETH_LP_CUSHION,
      REACT_APP_DAI_LP_CUSHION,
      REACT_APP_WBTC_LP_CUSHION,
    } = process.env;
    const providerUrl = `https://mainnet.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`;
    const provider = new ethers.providers.StaticJsonRpcProvider(providerUrl);
    console.log(`INFO(limits): Using provider at ${providerUrl}`);

    const fullRelayers = !REACT_APP_FULL_RELAYERS
      ? []
      : JSON.parse(REACT_APP_FULL_RELAYERS).map((relayer) => {
          return ethers.utils.getAddress(relayer);
        });
    console.log(`INFO(limits): Relayers ${fullRelayers}`);

    const transferRestrictedRelayers = !REACT_APP_TRANSFER_RESTRICTED_RELAYERS
      ? []
      : JSON.parse(REACT_APP_TRANSFER_RESTRICTED_RELAYERS).map((relayer) => {
          return ethers.utils.getAddress(relayer);
        });
    console.log(
      `INFO(limits): transferRestrictedRelayers ${transferRestrictedRelayers}`
    );

    let { token, destinationChainId, originChainId } = request.query;
    if (!isString(token) || !isString(destinationChainId))
      throw new InputError(
        "Must provide token and destinationChainId as query params"
      );

    if (originChainId === destinationChainId) {
      throw new InputError("Origin and destination chains cannot be the same");
    }

    token = ethers.utils.getAddress(token);

    const { l1Token, chainId: computedOriginChainId } = await getTokenDetails(
      provider,
      undefined,
      token,
      originChainId
    );

    const [tokenDetailsResult, routeEnabledResult] = await Promise.allSettled([
      getTokenDetails(provider, l1Token, undefined, destinationChainId),
      isRouteEnabled(computedOriginChainId, destinationChainId, token),
    ]);
    console.log(`INFO(limits): Fetched isRouteEnabled ${isRouteEnabled}`);

    // If any of the above fails or the route is not enabled, we assume that the
    if (
      disabledL1Tokens.includes(l1Token.toLowerCase()) ||
      tokenDetailsResult.status === "rejected" ||
      routeEnabledResult.status === "rejected" ||
      !routeEnabledResult.value
    ) {
      // Add the raw error (if any) to ensure that the user sees the real error if it's something unexpected, like a provider issue.
      const rawError = tokenDetailsResult.reason || routeEnabledResult.reason;
      const errorString = rawError
        ? `Raw Error: ${rawError.stack || rawError.toString()}`
        : "";
      throw new InputError(
        `Route from chainId ${computedOriginChainId} to chainId ${destinationChainId} with origin token address ${token} is not enabled. ${errorString}`
      );
    }

    const { l2Token: destinationToken } = tokenDetailsResult.value;
    const hubPool = HubPool__factory.connect(
      "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
      provider
    );

    const multicallInput = [
      hubPool.interface.encodeFunctionData("sync", [l1Token]),
      hubPool.interface.encodeFunctionData("pooledTokens", [l1Token]),
    ];

    console.log(
      `INFO(limits): Sending several requests to HubPool ${multicallInput} and fetching relayer balances`
    );
    const [
      relayerFeeDetails,
      multicallOutput,
      fullRelayerBalances,
      transferRestrictedBalances,
      fullRelayerMainnetBalances,
    ] = await Promise.all([
      getRelayerFeeDetails(
        l1Token,
        ethers.BigNumber.from("10").pow(18),
        Number(destinationChainId)
      ),
      hubPool.callStatic.multicall(multicallInput, { blockTag: -1 }),
      Promise.all(
        fullRelayers.map((relayer) =>
          getBalance(destinationChainId, destinationToken, relayer, -1)
        )
      ),
      Promise.all(
        transferRestrictedRelayers.map((relayer) =>
          getBalance(destinationChainId, destinationToken, relayer, -1)
        )
      ),
      Promise.all(
        fullRelayers.map((relayer) =>
          destinationChainId === "1"
            ? ethers.BigNumber.from("0")
            : getBalance("1", l1Token, relayer, -1)
        )
      ),
    ]);
    console.log(`INFO(limits): Called HubPool ${multicallOutput}`);
    console.log(
      `INFO(limits): Fetched fullRelayerBalances ${fullRelayerBalances}`
    );
    console.log(
      `INFO(limits): Fetched transferRestrictedBalances ${transferRestrictedBalances}`
    );
    console.log(
      `INFO(limits): Fetched fullRelayerMainnetBalances ${fullRelayerMainnetBalances}`
    );

    let { liquidReserves } = hubPool.interface.decodeFunctionResult(
      "pooledTokens",
      multicallOutput[1]
    );

    if (
      ethers.utils.getAddress(l1Token) ===
      ethers.utils.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
    ) {
      // Add WETH cushion to LP liquidity.
      liquidReserves = liquidReserves.sub(
        ethers.utils.parseEther(REACT_APP_WETH_LP_CUSHION || "0")
      );
      console.log(
        `INFO(limits): Adding WETH cushioning to LP liquidity: ${liquidReserves}`
      );
    } else if (
      ethers.utils.getAddress(l1Token) ===
      ethers.utils.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
    ) {
      // Add USDC cushion to LP liquidity.
      liquidReserves = liquidReserves.sub(
        ethers.utils.parseUnits(REACT_APP_USDC_LP_CUSHION || "0", 6)
      );
      console.log(
        `INFO(limits): Adding USDC cushioning to LP liquidity: ${liquidReserves}`
      );
    } else if (
      ethers.utils.getAddress(l1Token) ===
      ethers.utils.getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")
    ) {
      // Add WBTC cushion to LP liquidity.
      liquidReserves = liquidReserves.sub(
        ethers.utils.parseUnits(REACT_APP_WBTC_LP_CUSHION || "0", 8)
      );
      console.log(
        `INFO(limits): Adding WBTC cushioning to LP liquidity: ${liquidReserves}`
      );
    } else if (
      ethers.utils.getAddress(l1Token) ===
      ethers.utils.getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F")
    ) {
      // Add DAI cushion to LP liquidity.
      liquidReserves = liquidReserves.sub(
        ethers.utils.parseUnits(REACT_APP_DAI_LP_CUSHION || "0", 18)
      );
      console.log(
        `INFO(limits): Adding DAI cushioning to LP liquidity: ${liquidReserves}`
      );
    }

    if (liquidReserves.lt(0)) liquidReserves = ethers.BigNumber.from(0);

    const maxGasFee = ethers.utils
      .parseEther(maxRelayFeePct.toString())
      .sub(relayerFeeDetails.capitalFeePercent);
    console.log(`INFO(limits): Computed maxGasFee: ${maxGasFee}`);

    const transferBalances = fullRelayerBalances.map((balance, i) =>
      balance.add(fullRelayerMainnetBalances[i])
    );

    const responseJson = {
      minDeposit: ethers.BigNumber.from(relayerFeeDetails.gasFeeTotal)
        .mul(ethers.utils.parseEther("1"))
        .div(maxGasFee)
        .toString(),
      maxDeposit: liquidReserves.toString(),
      // Note: max is used here rather than sum because relayers currently do not partial fill.
      maxDepositInstant: minBN(
        maxBN(...fullRelayerBalances, ...transferRestrictedBalances),
        liquidReserves
      ).toString(),
      // Same as above.
      maxDepositShortDelay: minBN(
        maxBN(...transferBalances, ...transferRestrictedBalances),
        liquidReserves
      ).toString(),
    };
    console.log(`INFO(limits): Computed responseJson: ${responseJson}`);

    // Instruct Vercel to cache limit data for this token for 5 minutes. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    response.setHeader("Cache-Control", "s-maxage=300");
    response.status(200).json(responseJson);
  } catch (error) {
    let status;
    if (error instanceof InputError) {
      console.warn(`ERROR(limits): 400 input error: ${error}`);
      status = 400;
    } else {
      console.error(`ERROR(limits): 500 server error: ${error}`);
      status = 500;
    }
    response.status(status).send(error.message);
  }
};

module.exports = handler;
