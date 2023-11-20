import { Contract, ethers, providers } from "ethers";
import type { Event } from "ethers";
import { Provider } from "@ethersproject/providers";
import { Signer } from "@ethersproject/abstract-signer";

import type { TypedEvent, TypedEventFilter } from "utils/typechain";

export {
  Provider,
  Signer,
  Contract,
  TypedEventFilter,
  TypedEvent,
  Event,
  providers,
};

export type Result = ethers.utils.Result;

export type ContractTransaction = ethers.ContractTransaction;

export interface Callable {
  (...args: any[]): any;
}
