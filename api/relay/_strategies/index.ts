import { getGelatoStrategy } from "./gelato";
import { getLocalSignersStrategy } from "./local-signers";

const gelatoStrategy = getGelatoStrategy();
const localSignersStrategy = getLocalSignersStrategy();

export const strategiesByName = {
  [gelatoStrategy.strategyName]: gelatoStrategy,
  [localSignersStrategy.strategyName]: localSignersStrategy,
};
