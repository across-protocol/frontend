import { Contract, ethers } from "ethers";
import type { Event } from "ethers";
import { Provider } from "@ethersproject/providers";
import { Signer } from "@ethersproject/abstract-signer";

import type { TypedEvent, TypedEventFilter } from "utils/typechain";

export { Provider, Signer, Contract, TypedEventFilter, TypedEvent, Event };

export type Result = ethers.utils.Result;

export interface Callable {
  (...args: any[]): any;
}

export type GetEventType<
  ContractType extends Contract,
  EventName extends string
> = ReturnType<
  ContractType["filters"][EventName] extends Callable
    ? ContractType["filters"][EventName]
    : never
> extends TypedEventFilter<infer T, infer S>
  ? TypedEvent<T & S extends Result ? T & S : any>
  : never;
