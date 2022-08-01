const limitsHandler = require("../../api/limits");
const feesHandler = require("../../api/suggested-fees");

// Public infura key published in @umaprotocol/packages/common/ProviderUtils
process.env.REACT_APP_PUBLIC_INFURA_ID = "e34138b2db5b496ab5cc52319d2f0299";

// Create mocked response object:
const response = {};
response.status = jest.fn().mockReturnValue(response);
response.send = jest.fn();

// Query params must be strings or server should return 400. In these tests we purposefully trigger 400 errors because
// we want to test that the handler is importing all files and building correctly. We don't attempt to trigger 200
// successful responses because its difficult to replicate the production server.
const request = {
  query: {
    token: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    destinationChainId: 1,
  },
};

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
