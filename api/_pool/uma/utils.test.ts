import * as utils from "./utils";
import assert from "assert";
test("Balances", function () {
  const balances = utils.Balances();
  assert.ok(balances);
  balances.create("a", "100");
  balances.create("b", "99");
  let result = balances.get("a");
  assert.equal(result, "100");
  result = balances.get("b");
  assert.equal(result, "99");

  result = balances.sub("a", 1);
  assert.equal(result, "99");

  result = balances.sub("b", 1);
  assert.equal(result, "98");

  result = balances.add("b", 2);
  assert.equal(result, "100");

  const bals = balances.balances;
  assert.equal(Object.keys(bals).length, 2);
});
