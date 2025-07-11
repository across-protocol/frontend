import { getTokenByAddress } from "../_utils";
import { ApiHandler } from "../_base/api-handler";
import { VercelAdapter } from "../_adapters/vercel-adapter";
import { redisCache } from "../_cache";
import {
  OrderbookQueryParams,
  OrderbookResponse,
  OrderbookQueryParamsSchema,
  OrderbookResponseSchema,
  RelayerConfig,
} from "./_types";
import { getBaseCurrency } from "./_utils";

class OrderbookHandler extends ApiHandler<
  OrderbookQueryParams,
  OrderbookResponse
> {
  constructor() {
    super({
      name: "Orderbook",
      requestSchema: OrderbookQueryParamsSchema,
      responseSchema: OrderbookResponseSchema,
      headers: {
        "Cache-Control": "s-maxage=1, stale-while-revalidate=1",
      },
    });
  }

  protected async process(
    request: OrderbookQueryParams
  ): Promise<OrderbookResponse> {
    const {
      originChainId: _originChainId,
      destinationChainId: _destinationChainId,
      originToken,
      destinationToken,
    } = request;

    const originChainId = Number(_originChainId);
    const destinationChainId = Number(_destinationChainId);

    const relayerConfigs =
      await redisCache.getAll<RelayerConfig>("relayer-config*");

    if (!relayerConfigs) {
      throw new Error("No relayer configs found");
    }

    const originTokenInfo = getTokenByAddress(originToken, originChainId);
    const destinationTokenInfo = getTokenByAddress(
      destinationToken,
      destinationChainId
    );

    if (!originTokenInfo || !destinationTokenInfo) {
      throw new Error("Token information not found for provided addresses");
    }

    const originBaseCurrency = getBaseCurrency(originTokenInfo.symbol);
    const destinationBaseCurrency = getBaseCurrency(
      destinationTokenInfo.symbol
    );

    if (!originBaseCurrency || !destinationBaseCurrency) {
      throw new Error("Base currency not found for provided tokens");
    }

    const orderbooks: OrderbookResponse = {};

    for (const relayerConfig of relayerConfigs) {
      const originChainPrices = relayerConfig.prices[originChainId.toString()];
      const destinationChainPrices =
        relayerConfig.prices[destinationChainId.toString()];

      if (!originChainPrices || !destinationChainPrices) {
        continue;
      }

      const originTokenPrices =
        originChainPrices.origin?.[originBaseCurrency]?.[
          originTokenInfo.addresses[originChainId]
        ];
      const destinationTokenPrices =
        destinationChainPrices.destination?.[destinationBaseCurrency]?.[
          destinationTokenInfo.addresses[destinationChainId]
        ];

      if (!originTokenPrices || !destinationTokenPrices) {
        continue;
      }

      const originAmounts = Object.entries(originTokenPrices).sort(
        ([, a], [, b]) => b - a
      );
      const destinationAmounts = Object.entries(destinationTokenPrices).sort(
        ([, a], [, b]) => a - b
      );

      const orderbook = [];
      let destinationIndex = 0;
      let remainingDestinationAmount = 0;

      for (const [originAmount, originPrice] of originAmounts) {
        let remainingOriginAmount = Number(originAmount);

        while (
          remainingOriginAmount > 0 &&
          destinationIndex < destinationAmounts.length
        ) {
          const [destAmount, destPrice] = destinationAmounts[destinationIndex];
          const availableDestAmount =
            Number(destAmount) - remainingDestinationAmount;

          if (availableDestAmount > 0) {
            const matchAmount = Math.min(
              remainingOriginAmount,
              availableDestAmount
            );
            orderbook.push({
              amount: matchAmount,
              spread: destPrice - originPrice,
            });

            remainingOriginAmount -= matchAmount;
            remainingDestinationAmount += matchAmount;

            if (remainingDestinationAmount >= Number(destAmount)) {
              destinationIndex++;
              remainingDestinationAmount = 0;
            }
          } else {
            destinationIndex++;
            remainingDestinationAmount = 0;
          }
        }
      }

      orderbook.sort((a, b) => a.spread - b.spread);
      orderbooks[relayerConfig.authentication.address] = orderbook;
    }

    return orderbooks;
  }
}

const handler = new OrderbookHandler();
const adapter = new VercelAdapter<OrderbookQueryParams, OrderbookResponse>();
export default adapter.adaptHandler(handler);
