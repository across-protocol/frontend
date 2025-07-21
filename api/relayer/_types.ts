import {
  Infer,
  assign,
  number,
  object,
  type,
  record,
  string,
  boolean,
  optional,
  unknown,
  array,
} from "superstruct";
import { validAddress, positiveIntStr } from "../_utils";

export const OrderbookQueryParamsSchema = type({
  originChainId: positiveIntStr(),
  destinationChainId: positiveIntStr(),
  originToken: validAddress(),
  destinationToken: validAddress(),
});

export const OrderbookResponseSchema = record(
  validAddress(),
  array(
    object({
      amount: number(),
      spread: number(),
    })
  )
);

export const RelayerConfigSchema = type({
  prices: record(
    string(),
    object({
      origin: record(
        string(),
        record(validAddress(), record(positiveIntStr(), number()))
      ),
      destination: record(
        string(),
        record(validAddress(), record(positiveIntStr(), number()))
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

export const RelayerConfigCacheEntrySchema = assign(
  RelayerConfigSchema,
  object({
    updatedAt: number(),
  })
);

export type OrderbookQueryParams = Infer<typeof OrderbookQueryParamsSchema>;

export type OrderbookResponse = Infer<typeof OrderbookResponseSchema>;

export type RelayerConfig = Infer<typeof RelayerConfigSchema>;

export type RelayerConfigCacheEntry = Infer<
  typeof RelayerConfigCacheEntrySchema
>;
