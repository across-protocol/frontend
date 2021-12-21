// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.


const sdk = require("@uma/sdk");
const { BridgeAdminEthers__factory } = require("@uma/contracts-node");
const ethers = require("ethers");

const handler = async (request, response) => {
  try {
    const { REACT_APP_PUBLIC_INFURA_ID } = process.env;
    const provider = new ethers.providers.StaticJsonRpcProvider(`https://mainnet.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`);

    let { amount, l2Token, chainId } = request.query;
    if (!isString(amount) || !isString(l2Token) || !isString(chainId)) throw new InputError("Must provide amount and token as query params");

    let { l1Token } = await getTokenDetails(provider, l2Token, chainId);
    if (l1Token === sdk.across.constants.ADDRESSES.WETH) l1Token = sdk.across.constants.ADDRESSES.WETH;
    const depositFeeDetails = await sdk.across.gasFeeCalculator.getDepositFeesDetails(provider, amount, l1Token === sdk.across.constants.ADDRESSES.WETH ? sdk.across.constants.ADDRESSES.ETH : l1Token);
    if (depositFeeDetails.isAmountTooLow) throw new InputError("Sent amount is too low relative to fees");
    
    const responseJson = {
      slowFeePct: depositFeeDetails.slow.pct,
      instantFeePct: depositFeeDetails.instant.pct
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


const getTokenDetails = async (provider, l2Token, chainId) => {
  const bridgeAdmin = BridgeAdminEthers__factory.connect("0x30B44C676A05F1264d1dE9cC31dB5F2A945186b6", provider);

  // 2 queries: treating the token as the l1Token or treating the token as the L2 token.
  const l2TokenFilter = bridgeAdmin.filters.WhitelistToken(undefined, undefined, l2Token);

  // Filter events by chainId.
  const events = (await bridgeAdmin.queryFilter(l2TokenFilter, 0, "latest")).filter((event) => event.args.chainId.toString() === chainId);

  if (events.length === 0) throw new InputError("No whitelisted token found");

  // Sorting from most recent to oldest.
  events.sort((a, b) => {
    if (b.blockNumber !== a.blockNumber) return b.blockNumber - a.blockNumber;
    if (b.transactionIndex !== a.transactionIndex) return b.transactionIndex - a.transactionIndex;
    return b.logIndex - a.logIndex;
  });
  
  const event = events[0];

  return event.args;
}

const isString = (input) => typeof input === "string";

class InputError extends Error {}

module.exports = handler;