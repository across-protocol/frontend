import { type, string, Infer, array, optional } from "superstruct";
import { positiveIntStr } from "../_utils";
import { ApiHandler } from "../_base/api-handler";
import { VercelAdapter } from "../_adapters/vercel-adapter";

import {
  SOURCES as ZERO_X_SOURCES,
  ALL_SOURCES as ALL_ZERO_X_SOURCES,
} from "../_dexes/0x/utils/sources";
import {
  SOURCES as LIFI_SOURCES,
  ALL_SOURCES as ALL_LIFI_SOURCES,
} from "../_dexes/lifi/utils/sources";

const SwapSourcesQueryParamsSchema = type({
  chainId: optional(positiveIntStr()),
});

type SwapSourcesQueryParams = Infer<typeof SwapSourcesQueryParamsSchema>;

const SwapSourcesResponseSchema = array(string());

type SwapSourcesResponse = Infer<typeof SwapSourcesResponseSchema>;

class SwapSourcesHandler extends ApiHandler<
  SwapSourcesQueryParams,
  SwapSourcesResponse
> {
  constructor() {
    super({
      name: "SwapSources",
      requestSchema: SwapSourcesQueryParamsSchema,
      responseSchema: SwapSourcesResponseSchema,
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=60",
      },
    });
  }

  protected async process(
    request: SwapSourcesQueryParams
  ): Promise<SwapSourcesResponse> {
    const { chainId: chainIdParam } = request;

    let combinedSources: string[] = [];

    if (chainIdParam) {
      const chainId = Number(chainIdParam);
      const zeroXSources = ZERO_X_SOURCES.sources[chainId].map(
        (source) => source.key
      );
      const lifiSources = LIFI_SOURCES.sources[chainId].map(
        (source) => source.key
      );
      combinedSources = [...zeroXSources, ...lifiSources];
    } else {
      combinedSources = [...ALL_ZERO_X_SOURCES, ...ALL_LIFI_SOURCES];
    }

    const uniqueSources = [...new Set(combinedSources)].sort();
    return uniqueSources;
  }
}

const handler = new SwapSourcesHandler();
const adapter = new VercelAdapter<
  SwapSourcesQueryParams,
  SwapSourcesResponse
>();
export default adapter.adaptHandler(handler);
