import assert from "assert";
import { BigNumber, BigNumberish, delay as sleep } from "../../utils";

export { delay as sleep } from "../../utils";

// check if a value is not null or undefined, useful for numbers which could be 0.
// "is" syntax: https://stackoverflow.com/questions/40081332/what-does-the-is-keyword-do-in-typescript

export function exists<T>(
  value: T | null | undefined
): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// useful for maintaining balances from events
export type Balances = { [key: string]: string };
export function Balances(balances: Balances = {}) {
  function create(id: string, amount = "0") {
    assert(!has(id), "balance already exists");
    return set(id, amount);
  }
  function has(id: string) {
    return exists(balances[id]);
  }
  function set(id: string, amount: string) {
    balances[id] = amount;
    return amount;
  }
  function add(id: string, amount: BigNumberish) {
    return set(id, BigNumber.from(amount).add(getOrCreate(id)).toString());
  }
  function sub(id: string, amount: BigNumberish) {
    return set(id, BigNumber.from(getOrCreate(id)).sub(amount).toString());
  }
  function get(id: string) {
    assert(has(id), "balance does not exist");
    return balances[id];
  }
  function getOrCreate(id: string) {
    if (has(id)) return get(id);
    return create(id);
  }
  return { create, add, sub, get, balances, set, has, getOrCreate };
}

// Loop forever but wait until execution is finished before starting next timer. Throw an error to break this
// or add another utlity function if you need it to end on condition.

export async function loop(
  fn: (...args: any[]) => any,
  delay: number,
  ...args: any[]
) {
  do {
    await fn(...args);
    await sleep(delay);
    /* eslint-disable-next-line no-constant-condition */
  } while (true);
}
