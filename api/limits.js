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
} = require("./utils");

const handler = async (request, response) => {
  try {
    const {
      REACT_APP_PUBLIC_INFURA_ID,
      REACT_APP_FULL_RELAYERS,
      REACT_APP_TRANSFER_RESTRICTED_RELAYERS,
    } = process.env;
    const provider = new ethers.providers.StaticJsonRpcProvider(
      `https://mainnet.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`
    );

    const fullRelayers = JSON.parse(REACT_APP_FULL_RELAYERS).map((relayer) => {
      return ethers.utils.getAddress(relayer);
    });

    const transferRestrictedRelayers = JSON.parse(
      REACT_APP_TRANSFER_RESTRICTED_RELAYERS
    ).map((relayer) => {
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

    if (
      tokenDetailsResult.status === "rejected" ||
      routeEnabledResult.status === "rejected" ||
      !routeEnabledResult.value
    )
      throw new Error(
        `Route from chainId ${computedOriginChainId} to chainId ${destinationChainId} with origin token address ${token} is not enabled.`
      );

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

    const { liquidReserves } = hubPool.interface.decodeFunctionResult(
      "pooledTokens",
      multicallOutput[1]
    );

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
      maxDepositInstant: minBN(
        maxBN(...fullRelayerBalances, ...transferRestrictedBalances),
        liquidReserves
      ).toString(),
      maxDepositShortDelay: minBN(
        maxBN(...transferBalances, ...transferRestrictedBalances),
        liquidReserves
      ).toString(),
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
