// Public infura key published in @umaprotocol/packages/common/ProviderUtils
import limitsHandler from "../../api/limits";
import feesHandler from "../../api/suggested-fees";
import poolsHandler from "../../api/pools";
import coingeckoHandler from "../../api/coingecko";
import availableRouteHandler from "../../api/available-routes";
import { TypedVercelRequest } from "../../api/_types";

process.env.REACT_APP_PUBLIC_INFURA_ID = "e34138b2db5b496ab5cc52319d2f0299";
process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT = "{}";

const getMockedResponse = () => {
  const response: any = {};
  response.status = jest.fn().mockReturnValue(response);
  response.send = jest.fn();
  response.setHeader = jest.fn();
  response.json = jest.fn();
  return response;
};

describe("API Test", () => {
  // Create mocked response object:
  let response: any;

  // Query params must be strings or server should return 400. In these tests we purposefully trigger 400 errors because
  // we want to test that the handler is importing all files and building correctly. We don't attempt to trigger 200
  // successful responses because its difficult to replicate the production server.
  let request = { query: {} as any };

  beforeEach(() => {
    response = getMockedResponse();
  });

  test("limits has no load-time errors", async () => {
    await limitsHandler(request as TypedVercelRequest<any>, response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining(/At path: destinationChainId/)
    );
  });

  test("suggested-fees has no load-time errors", async () => {
    await feesHandler(request as TypedVercelRequest<any, any>, response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining(/At path: amount/)
    );
  });

  test("pools has no load-time errors", async () => {
    await poolsHandler(request as TypedVercelRequest<any>, response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining(/At path: token/)
    );
  });

  test("coingecko has no load-time errors", async () => {
    await coingeckoHandler(request as TypedVercelRequest<any>, response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining(/At path: l1Token/)
    );
  });

  test("available-routes has no load-time errors", async () => {
    await availableRouteHandler(request as TypedVercelRequest<any>, response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalled();
  });
});
