import { getGelatoStrategy } from "./gelato";

const gelatoStrategy = getGelatoStrategy();

export const strategiesByName = {
  [gelatoStrategy.strategyName]: gelatoStrategy,
};
