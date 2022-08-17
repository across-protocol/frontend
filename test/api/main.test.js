// Public infura key published in @umaprotocol/packages/common/ProviderUtils
process.env.REACT_APP_PUBLIC_INFURA_ID = "e34138b2db5b496ab5cc52319d2f0299";
process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT = "{}";

const limitsHandler = require("../../api/limits");
const feesHandler = require("../../api/suggested-fees");
const poolsHandler = require("../../api/pools");
const coingeckoHandler = require("../../api/coingecko");

// Create mocked response object:
let response;
const getMockedResponse = () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.send = jest.fn();
  response.setHeader = jest.fn();
  response.json = jest.fn();
  return response;
};

// Query params must be strings or server should return 400. In these tests we purposefully trigger 400 errors because
// we want to test that the handler is importing all files and building correctly. We don't attempt to trigger 200
// successful responses because its difficult to replicate the production server.
const request = {
  query: {},
};

beforeEach(() => {
  response = getMockedResponse();
});
test("limits has no load-time errors", async () => {
  await limitsHandler(request, response);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(response.send).toHaveBeenCalledWith(
    "Must provide token and destinationChainId as query params"
  );
});
test("suggested-fees has no load-time errors", async () => {
  await feesHandler(request, response);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(response.send).toHaveBeenCalledWith(
    "Must provide amount, token, and destinationChainId as query params"
  );
});
test("pools has no load-time errors", async () => {
  await poolsHandler(request, response);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(response.send).toHaveBeenCalledWith(
    "Must provide token as query param"
  );
});
test("coingecko has no load-time errors", async () => {
  await coingeckoHandler(request, response);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(response.send).toHaveBeenCalledWith(
    "Must provide l1Token as query param"
  );
});
