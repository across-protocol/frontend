import { VercelResponse } from "@vercel/node";
import { Infer, assert, object } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  getSpokePool,
  handleErrorCondition,
  positiveIntStr,
  sendResponse,
} from "./_utils";
import { defaultAbiCoder, keccak256 } from "ethers/lib/utils";
import { utils } from "@across-protocol/sdk";

const TrackDepositQueryParamsSchema = object({
  originChainId: positiveIntStr(),
  destinationChainId: positiveIntStr(),
  depositId: positiveIntStr(),
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
    const { originChainId, destinationChainId, depositId } = query;

    const originSpoke = getSpokePool(Number(originChainId));
    const destinationSpoke = getSpokePool(Number(destinationChainId));

    // Resolve the deposit event via the deposit ID.
    const [depositQuery, fillQuery] = await Promise.all([
      originSpoke.queryFilter(
        originSpoke.filters.V3FundsDeposited(
          null,
          null,
          null,
          null,
          null,
          depositId
        )
      ),
      destinationSpoke.queryFilter(
        destinationSpoke.filters.FilledV3Relay(
          null,
          null,
          null,
          null,
          null,
          originChainId,
          depositId
        )
      ),
    ]);

    if (depositQuery.length === 0) {
      throw new Error("No deposit found for the given deposit ID");
    }

    const v3RelayData = {
      depositor: depositQuery[0].args.depositor,
      recipient: depositQuery[0].args.recipient,
      exclusiveRelayer: depositQuery[0].args.exclusiveRelayer,
      inputToken: depositQuery[0].args.inputToken,
      outputToken: depositQuery[0].args.outputToken,
      inputAmount: depositQuery[0].args.inputAmount,
      outputAmount: depositQuery[0].args.outputAmount,
      originChainId: originChainId,
      depositId: depositQuery[0].args.depositId,
      fillDeadline: depositQuery[0].args.fillDeadline,
      exclusivityDeadline: depositQuery[0].args.exclusivityDeadline,
      message: depositQuery[0].args.message,
    };

    // ABI Encode the V3RelayData struct and the destination chain ID and
    // take the keccak256 hash of the result using ethers
    const v3RelayDataHash = keccak256(
      defaultAbiCoder.encode(
        [
          "tuple(address depositor, address recipient, address exclusiveRelayer, address inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 originChainId, uint256 depositId, uint256 fillDeadline, uint256 exclusivityDeadline, bytes message)",
          "uint256",
        ],
        [v3RelayData, destinationChainId]
      )
    );

    // Resolve the fill status of the deposit and resolve to a string
    // based on the FillStatus enum defined here:
    // https://github.com/across-protocol/contracts/blob/666bccb8cf839f2d82af2ecbb54c87c5b506d542/contracts/interfaces/V3SpokePoolInterface.sol#L10-L15
    const fillStatusQuery = (
      await destinationSpoke.callStatic.fillStatuses(v3RelayDataHash)
    ).toNumber();
    let fillStatus = ["pending", "slow-fill-requested", "filled"][
      fillStatusQuery
    ];

    if (
      fillStatus === "pending" &&
      depositQuery[0].args.fillDeadline < utils.getCurrentTime()
    ) {
      fillStatus = "expired";
    }

    // Respond with a 200 status code and 4 minutes of cache cache with
    // a minute of stale-while-revalidate.
    sendResponse(
      response,
      { fillStatus, fillHash: fillQuery?.[0].transactionHash },
      200,
      240,
      60
    );
  } catch (error: unknown) {
    return handleErrorCondition("track-deposit", response, logger, error);
  }
};

export default handler;
