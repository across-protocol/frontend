const healthHandler = require("../../api/health");
const limitsHandler = require("../../api/limits");
const feesHandler = require("../../api/suggested-fees");

test("serverless function is alive", async () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.send = jest.fn();
  const request = {};
  await healthHandler(request, response);
  expect(response.status).toHaveBeenCalledWith(200);
  expect(response.send).toHaveBeenCalledWith("Ok");
});
test("limits is alive", async () => {
  // Public infura key published in @umaprotocol/packages/common/ProviderUtils
  process.env.REACT_APP_PUBLIC_INFURA_ID = "e34138b2db5b496ab5cc52319d2f0299";

  // Query params must be strings or server should return 400. Here we purposefully trigger the 400 because
  // we want to just test that the handler is importing all files and building correctly.
  const request = {
    query: {
      token: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      destinationChainId: 1,
    },
  };
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.send = jest.fn();
  await limitsHandler(request, response);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(response.send).toHaveBeenCalledWith(
    "Must provide token and destinationChainId as query params"
  );
});
test("suggested-fees is alive", async () => {
  // Public infura key published in @umaprotocol/packages/common/ProviderUtils
  process.env.REACT_APP_PUBLIC_INFURA_ID = "e34138b2db5b496ab5cc52319d2f0299";

  // Query params must be strings or server should return 400. Here we purposefully trigger the 400 because
  // we want to just test that the handler is importing all files and building correctly.
  const request = {
    query: {
      token: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      destinationChainId: 1,
    },
  };
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.send = jest.fn();
  await feesHandler(request, response);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(response.send).toHaveBeenCalledWith(
    "Must provide amount, token, and destinationChainId as query params"
  );
});
