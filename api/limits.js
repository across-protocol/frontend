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
} = require("./_utils");

const handler = async (request, response) => {
  try {
    const {
      REACT_APP_PUBLIC_INFURA_ID,
      REACT_APP_FULL_RELAYERS, // These are relayers running a full auto-rebalancing strategy.
      REACT_APP_TRANSFER_RESTRICTED_RELAYERS, // These are relayers whose funds stay put.
    } = process.env;
    const provider = new ethers.providers.StaticJsonRpcProvider(
      `https://mainnet.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`
    );

    const fullRelayers = !REACT_APP_FULL_RELAYERS
      ? []
      : JSON.parse(REACT_APP_FULL_RELAYERS).map((relayer) => {
          return ethers.utils.getAddress(relayer);
        });

    const transferRestrictedRelayers = !REACT_APP_TRANSFER_RESTRICTED_RELAYERS
      ? []
      : JSON.parse(REACT_APP_TRANSFER_RESTRICTED_RELAYERS).map((relayer) => {
          return ethers.utils.getAddress(relayer);
        });

    let { token, destinationChainId, originChainId } = request.query;
    if (!isString(token) || !isString(destinationChainId))
      throw new InputError(
        "Must provide token and destinationChainId as query params"
      );

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

    // If any of the above fails or the route is not enabled, we assume that the
    if (
      tokenDetailsResult.status === "rejected" ||
      routeEnabledResult.status === "rejected" ||
      !routeEnabledResult.value
    ) {
      // Add the raw error (if any) to ensure that the user sees the real error if it's something unexpected, like a provider issue.
      const rawError = tokenDetailsResult.reason || routeEnabledResult.reason;
      const errorString = rawError
        ? `Raw Error: ${rawError.stack || rawError.toString()}`
        : "";
      throw new Error(
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
      hubPool.callStatic.multicall(multicallInput),
      Promise.all(
        fullRelayers.map((relayer) =>
          getBalance(destinationChainId, destinationToken, relayer)
        )
      ),
      Promise.all(
        transferRestrictedRelayers.map((relayer) =>
          getBalance(destinationChainId, destinationToken, relayer)
        )
      ),
      Promise.all(
        fullRelayers.map((relayer) =>
          destinationChainId === "1"
            ? ethers.BigNumber.from("0")
            : getBalance("1", l1Token, relayer)
        )
      ),
    ]);

    let { liquidReserves } = hubPool.interface.decodeFunctionResult(
      "pooledTokens",
      multicallOutput[1]
    );

    if (
      ethers.utils.getAddress(l1Token) ===
      ethers.utils.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
    ) {
      // Add a 2500 WETH cushion to LP liquidity.
      liquidReserves = liquidReserves.sub(ethers.utils.parseEther("2500"));
    } else if (
      ethers.utils.getAddress(l1Token) ===
      ethers.utils.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
    ) {
      // Add a 5MM USDC cushion to LP liquidity.
      liquidReserves = liquidReserves.sub(
        ethers.utils.parseUnits("5000000", 6)
      );
    }

    if (liquidReserves.lt(0)) liquidReserves = ethers.BigNumber.from(0);

    const maxGasFee = ethers.utils
      .parseEther(maxRelayFeePct.toString())
      .sub(relayerFeeDetails.capitalFeePercent);

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

    // Instruct Vercel to cache limit data for this token for 5 minutes. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    response.setHeader("Cache-Control", "s-maxage=300");
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
