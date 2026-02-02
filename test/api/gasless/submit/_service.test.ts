import { describe, expect, it, vi, beforeEach } from "vitest";

const MOCK_PERIPHERY_ADDRESS = "0x1234567890123456789012345678901234567890";
const MOCK_MESSAGE_ID = "msg-123";

// Mock all external dependencies
vi.mock("../../../../api/_spoke-pool-periphery", () => ({
  getSpokePoolPeripheryAddress: vi.fn(() => MOCK_PERIPHERY_ADDRESS),
}));

vi.mock("../../../../api/gasless/submit/_publish-pubsub", () => ({
  publishGaslessDepositMessage: vi.fn(() => Promise.resolve(MOCK_MESSAGE_ID)),
}));

vi.mock("../../../../api/_utils", () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock("../../../../api/_errors", () => ({
  InvalidParamError: class InvalidParamError extends Error {
    constructor(args: { message: string; param?: string }) {
      super(args.message);
    }
  },
}));

// Mock validation to skip superstruct chain
vi.mock("../../../../api/gasless/submit/_validation", () => ({
  GaslessSubmitBodySchema: {
    // Dummy schema that passes validation
  },
  GaslessTxSchema: {},
}));

// Mock superstruct assert to be a no-op
vi.mock("superstruct", () => ({
  assert: vi.fn(),
}));

// Import after mocks
const { handleGaslessSubmit } = await import(
  "../../../../api/gasless/submit/_service"
);

const validBody = {
  swapTx: {
    ecosystem: "evm-gasless" as const,
    chainId: 1,
    to: MOCK_PERIPHERY_ADDRESS,
    data: {
      type: "erc3009" as const,
      depositId: "dep-123",
      domainSeparator: "0xabcd",
      witness: { type: "BridgeWitness" as const, data: {} },
      permit: { types: {}, domain: {}, primaryType: "Test", message: {} },
    },
  },
  signature: "0xabcd1234",
};

describe("handleGaslessSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns depositId and messageId", async () => {
    const result = await handleGaslessSubmit(validBody, "req-123");

    expect(result).toEqual({
      depositId: "dep-123",
      messageId: MOCK_MESSAGE_ID,
    });
  });

  it("throws when swapTx.to does not match periphery address", async () => {
    const invalidBody = {
      ...validBody,
      swapTx: {
        ...validBody.swapTx,
        to: "0x0000000000000000000000000000000000000001",
      },
    };

    await expect(handleGaslessSubmit(invalidBody, "req-123")).rejects.toThrow(
      /Invalid target address/
    );
  });
});
