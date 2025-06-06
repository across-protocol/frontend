import { VercelResponse } from "@vercel/node";
import { latestBalanceCache } from "../../../api/_utils";
import handler from "../../../api/account-balance";
import { TypedVercelRequest } from "../../../api/_types";
import { createMockRequest, setupTestMocks } from "../helpers/test-helper";
import { InputError } from "../../../api/_errors";

jest.mock("../../../api/_utils", () => ({
  ...jest.requireActual("../../../api/_utils"),
  latestBalanceCache: jest.fn(),
  getLogger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe("Account balance handler tests", () => {
  let mockResponse: jest.Mocked<VercelResponse>;
  let mockGet: jest.Mock;

  beforeEach(() => {
    const mocks = setupTestMocks<VercelResponse>(
      latestBalanceCache as jest.Mock
    );
    mockResponse = mocks.mockResponse;
    mockGet = mocks.mockGet;
  });

  it("should return balance for valid request", async () => {
    const mockBalance = "1000000000000000000";
    mockGet.mockResolvedValueOnce(mockBalance);

    await handler(
      createMockRequest<
        TypedVercelRequest<{ token: string; account: string; chainId: string }>
      >({
        token: "0x1234567890123456789012345678901234567890",
        account: "0x0987654321098765432109876543210987654321",
        chainId: "1",
      }),
      mockResponse
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      balance: mockBalance,
      account: "0x0987654321098765432109876543210987654321",
      token: "0x1234567890123456789012345678901234567890",
    });
  });

  it("should handle invalid token address", async () => {
    await handler(
      createMockRequest({
        token: "invalid",
        account: "0x0987654321098765432109876543210987654321",
        chainId: "1",
      }),
      mockResponse
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json.mock.calls[0][0]).toBeInstanceOf(InputError);
  });

  it("should handle balance cache errors", async () => {
    mockGet.mockRejectedValueOnce(new Error("Cache error"));

    await handler(
      createMockRequest({
        token: "0x1234567890123456789012345678901234567890",
        account: "0x0987654321098765432109876543210987654321",
        chainId: "1",
      }),
      mockResponse
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(mockResponse.json.mock.calls[0][0].message).toContain("Cache error");
  });

  it("should handle missing required parameters", async () => {
    await handler(
      createMockRequest({
        token: "0x1234567890123456789012345678901234567890",
      }),
      mockResponse
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json.mock.calls[0][0]).toBeInstanceOf(InputError);
  });
});
