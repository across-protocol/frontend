import {
  Infer,
  number,
  object,
  type,
  record,
  string,
  boolean,
  optional,
  unknown,
} from "superstruct";
import { validAddress } from "../_utils";

export const OrderbookQueryParamsSchema = type({
  originChainId: number(),
  destinationChainId: number(),
  originToken: validAddress(),
  destinationToken: validAddress(),
});

export const OrderbookResponseSchema = type({
  relayerAddresses: record(validAddress(), record(string(), number())),
});

export const RelayerConfigSchema = type({
  prices: record(
    string(),
    object({
      origin: record(
        string(),
        record(string(), record(string(), record(string(), number())))
      ),
      destination: record(
        string(),
        record(string(), record(string(), record(string(), number())))
      ),
      messageExecution: boolean(),
    })
  ),
  minExclusivityPeriods: object({
    default: number(),
    routes: optional(record(string(), record(string(), number()))),
    origin: optional(record(string(), record(string(), number()))),
    destination: optional(record(string(), record(string(), number()))),
    sizes: optional(record(string(), number())),
  }),
  authentication: object({
    address: validAddress(),
    method: optional(string()),
    payload: optional(record(string(), unknown())),
  }),
});

export type OrderbookQueryParams = Infer<typeof OrderbookQueryParamsSchema>;

export type OrderbookResponse = Infer<typeof OrderbookResponseSchema>;

export type RelayerConfig = Infer<typeof RelayerConfigSchema>;
