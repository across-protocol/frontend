import { validateMethodArgs } from "./_utils";

export type RelayStrategyName = "gelato" | "local-signers";

export type RelayRequest = {
  chainId: number;
  to: string;
  methodNameAndArgs: ReturnType<typeof validateMethodArgs>;
  signatures: {
    permit: string; // use this for all auth signatures
    deposit: string;
  };
};

export type RelayStrategy = {
  strategyName: RelayStrategyName;
  queueParallelism: number;
  relay: (request: RelayRequest) => Promise<string>;
};
