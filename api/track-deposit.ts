import { VercelResponse } from "@vercel/node";
import { Infer, assert, object } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  extractDepositLogs,
  getLogger,
  handleErrorCondition,
  positiveIntStr,
  resolveFillStatusOfDeposits,
  sendResponse,
  validTxnHash,
} from "./_utils";

const TrackDepositQueryParamsSchema = object({
  originChainId: positiveIntStr(),
  depositHash: validTxnHash(),
});

type TrackDepositQueryParams = Infer<typeof TrackDepositQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<TrackDepositQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "track-deposit",
    message: "Query data",
    query,
  });
  try {
    // Ensure that the query parameters are valid.
    assert(query, TrackDepositQueryParamsSchema);

    // Resolve the query parameters.
    const { originChainId: _originChainId, depositHash } = query;
    const originChainId = Number(_originChainId);

    // Grab deposits associated with the transaction hash.
    const depositLogs = await extractDepositLogs(originChainId, depositHash);
    if (depositLogs.length === 0) {
      throw new Error("No deposits found for the given transaction hash");
    }

    // Retrieve deposit status
    const fills = await resolveFillStatusOfDeposits(depositLogs);

    const responseJson = {
      hello: fills,
    };

    // Respond with a 200 status code and 4 minutes of cache cache with
    // a minute of stale-while-revalidate.
    sendResponse(response, responseJson, 200, 240, 60);
  } catch (error: unknown) {
    return handleErrorCondition("track-deposit", response, logger, error);
  }
};

export default handler;
