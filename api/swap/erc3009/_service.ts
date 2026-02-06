import * as sdk from "@across-protocol/sdk";
import { Span } from "@opentelemetry/api";
import { Infer, type, optional } from "superstruct";

import { positiveIntStr } from "../../_utils";
import { SwapBody } from "../_utils";
import { TypedVercelRequest } from "../../_types";
import { InvalidParamError } from "../../_errors";
import { SECONDS_PER_YEAR } from "../../_constants";
import { handleSwap } from "../_swap-handler";

export const AuthQueryParamsSchema = type({
  authStart: optional(positiveIntStr()),
  authDeadline: optional(positiveIntStr()),
});

type AuthQueryParams = Infer<typeof AuthQueryParamsSchema>;

// 1 year from now
const DEFAULT_AUTH_DEADLINE_OFFSET = SECONDS_PER_YEAR;

export async function handleErc3009Swap(
  request: TypedVercelRequest<AuthQueryParams, SwapBody>,
  span?: Span
) {
  return handleSwap({
    request,
    span,
    flow: "erc3009",
    validateExtendedQueryParams: (query) => {
      if (!query.authStart && !query.authDeadline) {
        return;
      }

      let parsedAuthStart, parsedAuthDeadline;

      if (query.authStart) {
        const authStart = Number(query.authStart);
        // Allow authStart=0 as a special case meaning "always valid from epoch"
        if (authStart !== 0 && authStart < Math.floor(Date.now() / 1000)) {
          throw new InvalidParamError({
            message:
              "authStart must be 0 or a UNIX timestamp (seconds) in the future",
            param: "authStart",
          });
        }
        parsedAuthStart = authStart;
      }

      if (query.authDeadline) {
        const authDeadline = Number(query.authDeadline);
        if (authDeadline < Math.floor(Date.now() / 1000)) {
          throw new InvalidParamError({
            message:
              "auth deadline must be a UNIX timestamp (seconds) in the future",
            param: "authDeadline",
          });
        }
        parsedAuthDeadline = authDeadline;
      }

      return {
        authStart: parsedAuthStart,
        authDeadline: parsedAuthDeadline,
      };
    },
    buildOriginTx: async (context) => {
      const bridgeStrategy = context.bridgeStrategy;
      if (!bridgeStrategy.buildGaslessTx) {
        throw new Error(
          `Bridge strategy '${
            bridgeStrategy.name
          }' does not support gasless 'with-auth' flow`
        );
      }

      const { authStart: _authStart, authDeadline: _authDeadline } =
        context.extendedParams ?? {};

      const now = sdk.utils.getCurrentTime();
      const authStart = _authStart ?? now;

      // Use current time when authStart is 0 so we never calculate a relative duration.
      const userSuppliedAuth = (_authDeadline ?? _authStart) !== undefined;
      const deadlineBase =
        userSuppliedAuth && authStart !== 0 ? authStart : now;
      const authDeadline = userSuppliedAuth
        ? deadlineBase + DEFAULT_AUTH_DEADLINE_OFFSET
        : now + DEFAULT_AUTH_DEADLINE_OFFSET;

      return bridgeStrategy.buildGaslessTx({
        quotes: context.crossSwapQuotes,
        integratorId: context.integratorId,
        permitParams: {
          type: "erc3009",
          validAfter: authStart,
          validBefore: authDeadline,
        },
      });
    },
  });
}
