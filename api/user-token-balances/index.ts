import { VercelResponse } from "@vercel/node";
import { assert, Infer, type } from "superstruct";
import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition, validAddress } from "../_utils";
import { handleUserTokenBalances } from "./_service";
import { getRequestId, setRequestSpanAttributes } from "../_request_utils";
import { sendResponse } from "../_response_utils";
import { tracer, processor } from "../../instrumentation";

const UserTokenBalancesQueryParamsSchema = type({
  account: validAddress(),
});

type UserTokenBalancesQueryParams = Infer<
  typeof UserTokenBalancesQueryParamsSchema
>;

const handler = async (
  request: TypedVercelRequest<UserTokenBalancesQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  const requestId = getRequestId(request);
  logger.debug({
    at: "user-token-balances",
    message: "Request data",
    requestId,
  });

  return tracer.startActiveSpan("user-token-balances", async (span) => {
    setRequestSpanAttributes(request, span, requestId);

    try {
      const { query } = request;
      assert(query, UserTokenBalancesQueryParamsSchema);
      const { account } = query;

      const responseData = await handleUserTokenBalances(account);

      logger.debug({
        at: "user-token-balances",
        message: "Response data",
        responseJson: responseData,
        requestId,
      });

      sendResponse({
        response,
        body: responseData,
        statusCode: 200,
        requestId,
        cacheSeconds: 10, // 30 seconds cache - balances update frequently after transactions
        staleWhileRevalidateSeconds: 10,
      });
    } catch (error: unknown) {
      return handleErrorCondition(
        "user-token-balances",
        response,
        logger,
        error,
        span,
        requestId
      );
    } finally {
      span.end();
      processor.forceFlush();
    }
  });
};

export default handler;
