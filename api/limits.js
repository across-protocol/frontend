// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

const { HubPool__factory } = require("@across-protocol/contracts-v2");
const ethers = require("ethers");

const {
  InputError,
  isString,
  getRelayerFeeDetails,
  maxRelayFeePct,
} = require("./utils");

const handler = async (request, response) => {
  try {
    const { REACT_APP_PUBLIC_INFURA_ID } = process.env;
    const provider = new ethers.providers.StaticJsonRpcProvider(
      `https://mainnet.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`
    );

    let { l1Token, destinationChainId } = request.query;
    if (!isString(l1Token) || !isString(destinationChainId))
      throw new InputError("Must provide l1Token");

    const hubPool = HubPool__factory.connect(
      "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
      provider
    );

    const multicallInput = [
      hubPool.interface.encodeFunctionData("sync", [l1Token]),
      hubPool.interface.encodeFunctionData("pooledTokens", [l1Token]),
    ];

    const [relayerFeeDetails, multicallOutput] = await Promise.all([
      getRelayerFeeDetails(
        l1Token,
        ethers.BigNumber.from("10").pow(18),
        Number(destinationChainId)
      ),
      hubPool.callStatic.multicall(multicallInput),
    ]);

    const [{ liquidReserves }] = hubPool.interface.decodeFunctionResult(
      "pooledTokens",
      multicallOutput[1]
    );

    const maxGasFee = ethers.utils
      .parseEther(maxRelayFeePct.toString())
      .sub(relayerFeeDetails.capitalFeePercent);

    const responseJson = {
      minDeposit: relayerFeeDetails.gasFeeTotal
        .mul(ethers.parseEther("1"))
        .div(maxGasFee)
        .toString(), // Max fee pct is 25%
      maxDeposit: liquidReserves.toString(),
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
