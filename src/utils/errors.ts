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

export class WrongNetworkError extends Error {
  correctChainId: ChainId;
  public constructor(correctChainId: ChainId) {
    super();
    this.name = this.constructor.name;
    this.message = `Connected to the wrong network.`;
    this.correctChainId = correctChainId;
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

export class FeeTooHighError extends Error {
  public constructor() {
    super();
    this.name = this.constructor.name;
    this.message = "Fees are too high.";
  }
}
export class InsufficientLiquidityError extends Error {
  public constructor(token: string) {
    super();
    this.name = this.constructor.name;
    this.message = `Insufficient liquidity for ${token}.`;
  }
}

export class InsufficientBalanceError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;
    this.message = "Insufficient balance.";
  }
}
