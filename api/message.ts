import { VercelResponse } from "@vercel/node";
import {
  getLogger,
  handleErrorCondition,
  bytes32,
  messageCache,
} from "./_utils";
import { assert, Infer, type } from "superstruct";
import { TypedVercelRequest } from "./_types";

const MessageQueryParamsSchema = type({
  messageHash: bytes32(),
});

type MessageQueryParams = Infer<typeof MessageQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<MessageQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    assert(query, MessageQueryParamsSchema);

    const { messageHash } = query;

    const ttl = 60;
    const message = await messageCache({ messageHash, ttl }).get();

    const responseJson = { message };

    // Instruct Vercel to cache limit data for this token for 6 hours. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    logger.debug({
      at: "Message",
      message: "Response data",
      responseJson,
    });
    response.setHeader("Cache-Control", "s-maxage=21600");
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("message", response, logger, error);
  }
};

export default handler;
