import { beforeEach, describe, expect, it, vi } from "vitest";
import gaslessHandler from "../../../api/gasless/index";
import { TypedVercelRequest } from "../../../api/_types";

const getMockedResponse = () => {
  const response: any = {};
  response.status = vi.fn().mockReturnValue(response);
  response.setHeader = vi.fn().mockReturnValue(response);
  response.json = vi.fn();
  return response;
};

const mockFetchPending = vi.fn();

vi.mock("../../../api/gasless/_service", () => ({
  fetchPendingGaslessDepositsFromCache: (...args: unknown[]) =>
    mockFetchPending(...args),
}));

vi.mock("../../../api/_logger", () => ({
  getLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockSpan = {
  setAttribute: vi.fn(),
  end: vi.fn(),
  recordException: vi.fn(),
  setStatus: vi.fn(),
};

vi.mock("../../../instrumentation", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../instrumentation")>();
  return {
    ...actual,
    tracer: {
      startActiveSpan: (_name: string, fn: (span: unknown) => Promise<void>) =>
        fn(mockSpan),
    },
    processor: { forceFlush: vi.fn() },
  };
});

vi.mock("../../../api/_request_utils", () => ({
  getRequestId: vi.fn().mockReturnValue("test-request-id"),
  setRequestSpanAttributes: vi.fn(),
}));

vi.mock("@vercel/functions", () => ({
  waitUntil: vi.fn(),
}));

describe("api/gasless handler", () => {
  let response: ReturnType<typeof getMockedResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    response = getMockedResponse();
    mockFetchPending.mockResolvedValue({ deposits: [], cleanup: vi.fn() });
  });

  it("GET with status=pending returns 200 and deposits from service", async () => {
    const deposits = [
      {
        swapTx: {
          ecosystem: "evm_gasless",
          chainId: 10,
          to: "0x1234567890123456789012345678901234567890",
          typedData: null,
          data: {
            type: "erc3009",
            depositId: "123",
            witness: { BridgeWitness: { type: "BridgeWitness", data: {} } },
            permit: {},
            domainSeparator: "0x",
            integratorId: null,
          },
        },
        signature: "0xabc",
        submittedAt: "2026-02-03T01:00:00.000Z",
        requestId: "test-request-id",
        messageId: "msg-1",
      },
    ];
    mockFetchPending.mockResolvedValue({ deposits, cleanup: vi.fn() });

    const request = {
      method: "GET",
      query: { status: "pending" },
      headers: {},
    } as unknown as TypedVercelRequest<{ status: "pending" }>;

    await gaslessHandler(request, response);

    expect(mockFetchPending).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ deposits })
    );
  });

  it("GET without status=pending returns 400", async () => {
    const request = {
      method: "GET",
      query: {},
      headers: {},
    } as unknown as TypedVercelRequest<Record<string, unknown>>;

    await gaslessHandler(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(mockFetchPending).not.toHaveBeenCalled();
  });

  it("GET with status other than pending returns 400", async () => {
    const request = {
      method: "GET",
      query: { status: "completed" },
      headers: {},
    } as unknown as TypedVercelRequest<Record<string, unknown>>;

    await gaslessHandler(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(mockFetchPending).not.toHaveBeenCalled();
  });

  it("POST returns 405 Method Not Allowed", async () => {
    const request = {
      method: "POST",
      query: { status: "pending" },
      headers: {},
    } as unknown as TypedVercelRequest<{ status: "pending" }>;

    await gaslessHandler(request, response);

    expect(response.setHeader).toHaveBeenCalledWith("Allow", "GET");
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Method Not Allowed",
        message: "Only GET is supported for /api/gasless",
      })
    );
    expect(mockFetchPending).not.toHaveBeenCalled();
  });
});
