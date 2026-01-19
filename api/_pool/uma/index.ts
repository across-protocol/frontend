import { Contract, ethers, Event } from "ethers";
import type {
  TypedEventFilterEthers as TypedEventFilter,
  TypedEventEthers as TypedEvent,
} from "@uma/contracts-node";

export * as across from "./across";
export * as clients from "./clients";
export * as oracle from "./oracle";
export * as utils from "./utils";

export { type Provider } from "@ethersproject/providers";

type Result = ethers.utils.Result;

export interface Callable {
  (...args: unknown[]): unknown;
}

export type SerializableEvent = Omit<
  Event,
  | "decode"
  | "removeListener"
  | "getBlock"
  | "getTransaction"
  | "getTransactionReceipt"
>;

// this convoluted type is meant to cast events to the types you need based on the contract and event name
// example: type NewContractRegistered = GetEventType<Registry,"NewContractRegistered">;
// TODO: the any below is a hacky solution because some typechain types fail to resolve due to
// incompatible TypedEventFilter and TypedEvent types. This will be fixed by upgrading typechain
// to a version where Ethers events are exported as first class types.
export type GetEventType<
  ContractType extends Contract,
  EventName extends string,
> =
  ReturnType<
    ContractType["filters"][EventName] extends Callable
      ? ContractType["filters"][EventName]
      : never
  > extends TypedEventFilter<infer T, infer S>
    ? TypedEvent<T & S extends Result ? T & S : any>
    : never;
