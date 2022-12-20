// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

import * as sdk from "@across-protocol/sdk-v2";
import { BlockFinder } from "@uma/sdk";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { disabledL1Tokens, DEFAULT_QUOTE_TIMESTAMP_BUFFER } from "./_constants";
import { isString } from "./_typeguards";
import { SuggestedFeesInputRequest } from "./_types";
import {
  getLogger,
  getTokenDetails,
  InputError,
  infuraProvider,
  getRelayerFeeDetails,
  isRouteEnabled,
  getCachedTokenPrice,
  handleErrorCondition,
} from "./_utils";

const handler = async (
  {
    query: {
      amount: amountInput,
      token,
      timestamp,
      destinationChainId,
      originChainId,
      skipAmountLimit,
    },
  }: SuggestedFeesInputRequest,
  response: VercelResponse
) => {
  const logger = getLogger();
  try {
    const { QUOTE_TIMESTAMP_BUFFER } = process.env;
    const quoteTimeBuffer = QUOTE_TIMESTAMP_BUFFER
      ? Number(QUOTE_TIMESTAMP_BUFFER)
      : DEFAULT_QUOTE_TIMESTAMP_BUFFER;

    const provider = infuraProvider("mainnet");

    if (
      !isString(amountInput) ||
      !isString(token) ||
      !isString(destinationChainId)
    )
      throw new InputError(
        "Must provide amount, token, and destinationChainId as query params"
      );
    if (originChainId === destinationChainId) {
      throw new InputError("Origin and destination chains cannot be the same");
    }

    const amountAsValue = Number(amountInput);
    if (Number.isNaN(amountAsValue) || amountAsValue <= 0) {
      throw new InputError("Value provided in amount parameter is not valid.");
    }

    token = ethers.utils.getAddress(token);

    // Note: Add a buffer to "latest" timestamp so that it corresponds to a block
    // older than HEAD. This is to improve relayer UX who have heightened risk of sending inadvertent invalid
    // fills for quote times right at HEAD (or worst, in the future of HEAD). If timestamp is supplied as a query param,
    // then no need to apply buffer.
    const parsedTimestamp = isString(timestamp)
      ? Number(timestamp)
      : (await provider.getBlock("latest")).timestamp - quoteTimeBuffer;

    const amount = ethers.BigNumber.from(amountInput);

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
      isRouteEnabled(computedOriginChainId, Number(destinationChainId), token),
    ]);

    if (!routeEnabled || disabledL1Tokens.includes(l1Token.toLowerCase()))
      throw new InputError(
        `Route from chainId ${computedOriginChainId} to chainId ${destinationChainId} with origin token address ${token} is not enabled.`
      );

    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      "0x3B03509645713718B78951126E0A6de6f10043f5",
      provider
    );

    const baseCurrency = destinationChainId === "137" ? "matic" : "eth";

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
      getCachedTokenPrice(l1Token, baseCurrency),
    ]);
    const realizedLPFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );
    const relayerFeeDetails = await getRelayerFeeDetails(
      l1Token,
      amount,
      Number(destinationChainId),
      tokenPrice
    );

    const skipAmountLimitEnabled = skipAmountLimit === "true";

    if (!skipAmountLimitEnabled && relayerFeeDetails.isAmountTooLow)
      throw new InputError("Sent amount is too low relative to fees");

    const responseJson = {
      capitalFeePct: relayerFeeDetails.capitalFeePercent,
      capitalFeeTotal: relayerFeeDetails.capitalFeeTotal,
      relayGasFeePct: relayerFeeDetails.gasFeePercent,
      relayGasFeeTotal: relayerFeeDetails.gasFeeTotal,
      relayFeePct: relayerFeeDetails.relayFeePercent,
      relayFeeTotal: relayerFeeDetails.relayFeeTotal,
      lpFeePct: realizedLPFeePct.toString(),
      timestamp: parsedTimestamp.toString(),
      isAmountTooLow: relayerFeeDetails.isAmountTooLow,
      quoteBlock: blockTag.toString(),
    };

    response.status(200).json(responseJson);
  } catch (error) {
    return handleErrorCondition("suggested-fees", response, logger, error);
  }
};

export default handler;
