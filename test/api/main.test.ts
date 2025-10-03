import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ethers } from "ethers";

// Public infura key published in @umaprotocol/packages/common/ProviderUtils
import availableRouteHandler from "../../api/available-routes";
import coingeckoHandler from "../../api/coingecko";
import limitsHandler from "../../api/limits";
import poolsHandler from "../../api/pools";
import feesHandler from "../../api/suggested-fees";
import { TypedVercelRequest } from "../../api/_types";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { assert } from "console";

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
  const request = { query: {} as any };

  const memoryExporter = new InMemorySpanExporter();

  const sdk = new NodeSDK({
    traceExporter: memoryExporter,
    spanProcessor: new SimpleSpanProcessor(memoryExporter),
  });

  // Start the SDK before tests run
  beforeAll(() => sdk.start());

  // Shut it down after
  afterAll(() => sdk.shutdown());

  beforeEach(() => {
    response = getMockedResponse();
  });

  test("limits has no load-time errors", async () => {
    await limitsHandler(request as TypedVercelRequest<any, any>, response);
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

  test("suggested-fees should set correct limit attributes on the span", async () => {
    const query = {
      amount: ethers.utils.parseUnits("100", 6).toString(), // 100 USDC
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      originChainId: CHAIN_IDs.OPTIMISM.toString(),
      destinationChainId: CHAIN_IDs.ARBITRUM.toString(),
    };

    // Create a partial implementation of the request with only the properties we need
    const feesRequest = { query } as unknown as TypedVercelRequest<any, any>;

    await feesHandler(feesRequest, response);

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBeGreaterThan(0);

    const suggestedFeesSpan = spans.find((s) => s.name === "suggested-fees");
    assert(suggestedFeesSpan, "suggested-fees span not found");
    expect(suggestedFeesSpan).toBeDefined();
    const attributes = suggestedFeesSpan!.attributes;

    expect(typeof attributes["limits.minDeposit.token"]).toBe("number");
    expect(attributes["limits.minDeposit.token"]).toBeGreaterThanOrEqual(0);
    expect(typeof attributes["limits.minDeposit.usd"]).toBe("number");
    expect(attributes["limits.minDeposit.usd"]).toBeGreaterThanOrEqual(0);

    expect(typeof attributes["limits.maxDeposit.token"]).toBe("number");
    expect(attributes["limits.maxDeposit.token"]).toBeGreaterThan(0);
    expect(typeof attributes["limits.maxDeposit.usd"]).toBe("number");
    expect(attributes["limits.maxDeposit.usd"]).toBeGreaterThan(0);

    expect(typeof attributes["limits.maxDepositInstant.token"]).toBe("number");
    expect(attributes["limits.maxDepositInstant.token"]).toBeGreaterThanOrEqual(
      0
    );
    expect(typeof attributes["limits.maxDepositInstant.usd"]).toBe("number");
    expect(attributes["limits.maxDepositInstant.usd"]).toBeGreaterThanOrEqual(
      0
    );

    expect(typeof attributes["limits.maxDepositShortDelay.token"]).toBe(
      "number"
    );
    expect(
      attributes["limits.maxDepositShortDelay.token"]
    ).toBeGreaterThanOrEqual(0);
    expect(typeof attributes["limits.maxDepositShortDelay.usd"]).toBe("number");
    expect(
      attributes["limits.maxDepositShortDelay.usd"]
    ).toBeGreaterThanOrEqual(0);
  }, 30000);
});
