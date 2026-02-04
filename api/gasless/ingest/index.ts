import { VercelRequest, VercelResponse } from "@vercel/node";
import { assert, Infer, string, type } from "superstruct";
import { getLogger, handleErrorCondition } from "../../_utils";
import { getRequestId, setRequestSpanAttributes } from "../../_request_utils";
import { tracer, processor } from "../../../instrumentation";
import { redisCache } from "../../_cache";
import {
  getGaslessPushSecret,
  GASLESS_REDIS_KEYS,
  GASLESS_DEPOSIT_TTL_SECONDS,
  getGaslessPubSubConfig,
} from "../_config";
import { PubSubPushMessageSchema } from "../_types";
import { getDepositStatus } from "../../_indexer-api";
import { isWithinTtl, decodeBase64MessageData } from "../_utils";
import {
  AcrossApiError,
  HttpErrorToStatusCode,
  UnauthorizedError,
} from "../../_errors";
import { getPubSubClient, publishToDlt } from "../../_pubsub";

const IngestQuerySchema = type({
  token: string(),
});

type IngestQuery = Infer<typeof IngestQuerySchema>;

const logger = getLogger();

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const requestId = getRequestId(request);

  return tracer.startActiveSpan("gasless/ingest", async (span) => {
    setRequestSpanAttributes(request, span, requestId);

    try {
      if (request.method !== "POST") {
        throw new AcrossApiError({
          message: "Method not allowed. Use POST.",
          status: HttpErrorToStatusCode.METHOD_NOT_ALLOWED,
          code: "INVALID_METHOD",
        });
      }

      const pushSecret = getGaslessPushSecret();
      if (!pushSecret) {
        throw new AcrossApiError({
          message: "'GASLESS_PUSH_SECRET' not configured",
          status: HttpErrorToStatusCode.INTERNAL_SERVER_ERROR,
        });
      }

      const query = request.query as IngestQuery;
      if (query.token !== pushSecret) {
        throw new UnauthorizedError({
          message: "Invalid push token",
        });
      }

      // Parse Pub/Sub push envelope
      const body = request.body;
      try {
        assert(body, PubSubPushMessageSchema);
      } catch {
        logger.warn({
          at: "gasless/ingest",
          message: "Invalid Pub/Sub push message format",
          requestId,
          body,
        });
        // Return 200 to ack malformed message (don't retry)
        return response
          .status(200)
          .json({ status: "acked", reason: "malformed" });
      }

      const { message } = body;
      const rawData = Buffer.isBuffer(message.data)
        ? message.data
        : Buffer.from(message.data);

      // Check TTL - if expired, ack and publish to DLT
      if (!isWithinTtl(message.publishTime, GASLESS_DEPOSIT_TTL_SECONDS)) {
        logger.debug({
          at: "gasless/ingest",
          message: "Message TTL expired, acking and publishing to DLT",
          requestId,
          messageId: message.messageId,
          publishTime: message.publishTime,
        });

        // push to dlt
        await publishToDlt({
          client: getPubSubClient(),
          dltName: getGaslessPubSubConfig().dltTopicName,
          rawData,
        });

        return response
          .status(200)
          .json({ status: "acked", reason: "expired" });
      }

      // Decode deposit data
      const deposit = decodeBase64MessageData(message.data);
      if (
        !deposit ||
        !deposit.swapTx?.data?.depositId ||
        !deposit.swapTx?.chainId
      ) {
        logger.warn({
          at: "gasless/ingest",
          message: "Failed to decode deposit data, acking",
          requestId,
          messageId: message.messageId,
        });
        return response
          .status(200)
          .json({ status: "acked", reason: "decode_error" });
      }

      const depositId = deposit.swapTx.data.depositId;
      const originChainId = deposit.swapTx.chainId;

      // Check indexer for deposit status
      try {
        const depositStatus = await getDepositStatus({
          originChainId,
          depositId,
        });

        // if deposit status is pending, filled or expired, remove from cache and ack
        const shouldRemoveFromCache = [
          "pending",
          "filled",
          "expired",
          "failed",
        ].includes(depositStatus?.status ?? "");

        if (shouldRemoveFromCache) {
          logger.debug({
            at: "gasless/ingest",
            message: `Deposit status is ${depositStatus?.status}, removing from cache and acking`,
            requestId,
            depositId,
            originChainId,
          });
          await removeDepositFromCache(depositId);
          return response.status(200).json({
            status: "acked",
            reason: depositStatus?.status,
            depositId,
          });
        }

        // Deposit is pending or not found in indexer yet
        // Ensure it's in the cache (may have been written by submit, but ensure consistency)
        const depositKey = GASLESS_REDIS_KEYS.deposit(depositId);
        const pendingSetKey = GASLESS_REDIS_KEYS.pendingSet();

        const depositWithMeta = {
          ...deposit,
          messageId: message.messageId,
        };

        await redisCache.set(
          depositKey,
          depositWithMeta,
          GASLESS_DEPOSIT_TTL_SECONDS
        );
        await redisCache.sadd(pendingSetKey, depositId);

        logger.debug({
          at: "gasless/ingest",
          message: "Deposit still pending, cached",
          requestId,
          depositId,
          originChainId,
          indexerStatus: depositStatus?.status ?? "not_found",
        });

        return response.status(200).json({
          status: "acked",
          reason: "pending",
          depositId,
        });
      } catch (error) {
        // Indexer check failed - nack to retry later
        logger.warn({
          at: "gasless/ingest",
          message: "Failed to check deposit status, nacking for retry",
          requestId,
          depositId,
          originChainId,
          error,
        });

        // Return 5xx to trigger Pub/Sub retry
        return response.status(503).json({
          error: "Indexer unavailable",
          depositId,
        });
      }
    } catch (error: unknown) {
      // Return 5xx to trigger Pub/Sub retry
      logger.error({
        at: "gasless/ingest",
        message: "Failed to ingest deposit",
        requestId,
        error,
      });
      return handleErrorCondition(
        "gasless/ingest",
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
}

/**
 * Remove a deposit from Redis cache (pending set + deposit key).
 */
async function removeDepositFromCache(depositId: string): Promise<void> {
  const depositKey = GASLESS_REDIS_KEYS.deposit(depositId);
  const pendingSetKey = GASLESS_REDIS_KEYS.pendingSet();

  await Promise.all([
    redisCache.del(depositKey),
    redisCache.srem(pendingSetKey, depositId),
  ]);
}
