import assert from "assert";
import { ethers } from "ethers";
import * as Client from "./client";

const address = "0xeca82185adCE47f39c684352B0439f030f860318";
// these require integration testing, skip for ci
describe("erc20", function () {
  let events: any;
  let client: Client.Instance;
  test("inits", function () {
    const provider = ethers.providers.getDefaultProvider(
      process.env.CUSTOM_NODE_URL
    );
    client = Client.connect(address, provider);
    assert.ok(client);
  });
  test("getEventState between", async function () {
    events = await client.queryFilter({}, 12477952, 12477952 + 1000);
    assert.ok(events.length);
  });
  test("getEventState", async function () {
    const state = await Client.getEventState(events);
    assert.ok(state.balances);
    assert.ok(state.approvalsByOwner);
    assert.ok(state.approvalsBySpender);
  });
});
