import { utils } from "@across-protocol/sdk";
import { VercelResponse } from "@vercel/node";
import { Infer, assert, object } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  getSpokePool,
  handleErrorCondition,
  hexString,
  positiveIntStr,
  sendResponse,
} from "./_utils";

const DepositStatusQueryParamsSchema = object({
  fillDeadline: positiveIntStr(),
  destinationChainId: positiveIntStr(),
  relayHash: hexString(),
});

type DepositStatusQueryParams = Infer<typeof DepositStatusQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<DepositStatusQueryParams>,
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
    assert(query, DepositStatusQueryParamsSchema);
    // Resolve the query parameters.
    const { fillDeadline, destinationChainId, relayHash } = query;
    // Resolve the fill status of the deposit and resolve to a string
    // based on the FillStatus enum defined here:
    // https://github.com/across-protocol/contracts/blob/666bccb8cf839f2d82af2ecbb54c87c5b506d542/contracts/interfaces/V3SpokePoolInterface.sol#L10-L15
    const fillStatusQuery = await getSpokePool(
      Number(destinationChainId)
    ).callStatic.fillStatuses(relayHash);
    let fillStatus = ["pending", "slow-fill-requested", "filled"][
      fillStatusQuery.toNumber()
    ];
    // Conditional Case: If the fill status is pending and the fill deadline has passed, then the fill status is expired.
    if (
      fillStatus === "pending" &&
      Number(fillDeadline) < utils.getCurrentTime()
    ) {
      fillStatus = "expired";
    }
    // Respond with a 200 status code. The cache time is 5 seconds
    // if the fill status is pending or slow-fill-requested, otherwise 240 seconds.
    const cacheTime =
      fillStatus === "pending" || fillStatus === "slow-fill-requested"
        ? 5
        : 240;

    sendResponse(response, { fillStatus }, 200, cacheTime, 5);
  } catch (error: unknown) {
    return handleErrorCondition("track-deposit", response, logger, error);
  }
};

export default handler;
