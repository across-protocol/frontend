import { ChainId } from "./constants";

export class UnsupportedChainIdError extends Error {
  public constructor(unsupportedChainId: number) {
    super();
    this.name = this.constructor.name;
    this.message = `Unsupported chain id: ${unsupportedChainId}. Supported chains are: ${[
      ...Object.values(ChainId),
    ]}.`;
  }
}

export class ParsingError extends Error {
  public constructor() {
    super();
    this.name = this.constructor.name;
    this.message = "Invalid number.";
  }
}

export class TransactionError extends Error {
  public constructor(address: string, method?: string, ...txArgs: unknown[]) {
    super();
    this.name = this.constructor.name;
    this.message = `Transaction to ${address} calling ${method} reverted with args: [${txArgs}]`;
  }
}
