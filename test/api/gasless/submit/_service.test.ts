import { describe, expect, it, vi, beforeEach } from "vitest";

const MOCK_PERIPHERY_ADDRESS = "0x1234567890123456789012345678901234567890";
const MOCK_MESSAGE_ID = "msg-123";
const MOCK_SIGNER_ADDRESS = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
const MOCK_INPUT_TOKEN = "0x0000000000000000000000000000000000000001";
const MOCK_OUTPUT_TOKEN = "0x0000000000000000000000000000000000000002";

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
  getTokenInfo: vi.fn(() =>
    Promise.resolve({ symbol: "USDC", decimals: 6, address: MOCK_INPUT_TOKEN })
  ),
  toAddressType: vi.fn((address: string) => ({
    toNative: () => address,
  })),
}));

vi.mock("../../../../api/_sponsored-gasless-config", () => ({
  getSponsoredGaslessRoute: vi.fn(() => ({
    originChainId: 1,
    destinationChainId: 10,
    inputTokenSymbol: "USDC",
    outputTokenSymbol: "USDC",
  })),
}));

vi.mock("../../../../api/_errors", () => ({
  InvalidParamError: class InvalidParamError extends Error {
    param?: string;
    constructor(args: { message: string; param?: string }) {
      super(args.message);
      this.param = args.param;
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(args: { message: string }) {
      super(args.message);
    }
  },
}));

// Mock validation to skip superstruct chain
vi.mock("../../../../api/gasless/submit/_validation", () => ({
  GaslessSubmitBodySchema: {},
  GaslessTxSchema: {},
}));

// Mock superstruct assert to be a no-op
vi.mock("superstruct", async (importOriginal) => {
  const actual = await importOriginal<typeof import("superstruct")>();
  return {
    ...actual,
    assert: vi.fn(),
  };
});

// Mock ethers utils.verifyTypedData
const mockVerifyTypedData = vi.fn(() => MOCK_SIGNER_ADDRESS);
vi.mock("ethers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ethers")>();
  return {
    ...actual,
    utils: {
      ...actual.utils,
      verifyTypedData: () => mockVerifyTypedData(),
    },
  };
});

// Import after mocks
const { handleGaslessSubmit } = await import(
  "../../../../api/gasless/submit/_service"
);

const createValidBody = (
  overrides: {
    signerAddress?: string;
    depositor?: string;
    witnessType?: "BridgeWitness" | "BridgeAndSwapWitness";
  } = {}
) => {
  const signerAddress = overrides.signerAddress ?? MOCK_SIGNER_ADDRESS;
  const depositor = overrides.depositor ?? MOCK_SIGNER_ADDRESS;
  const witnessType = overrides.witnessType ?? "BridgeWitness";

  const baseDepositData = {
    depositor,
    inputToken: MOCK_INPUT_TOKEN,
    outputToken: MOCK_OUTPUT_TOKEN,
    destinationChainId: "10",
  };

  const witnessData =
    witnessType === "BridgeWitness"
      ? { baseDepositData }
      : { depositData: baseDepositData };

  return {
    swapTx: {
      ecosystem: "evm-gasless" as const,
      chainId: 1,
      to: MOCK_PERIPHERY_ADDRESS,
      data: {
        type: "erc3009" as const,
        depositId: "dep-123",
        domainSeparator: "0xabcd",
        witness: { type: witnessType, data: witnessData },
        permit: {
          types: [
            {
              ReceiveWithAuthorization: {
                from: { name: "from", type: "address" },
                to: { name: "to", type: "address" },
                value: { name: "value", type: "uint256" },
              },
            },
          ],
          domain: {
            name: "TestToken",
            version: "1",
            chainId: 1,
            verifyingContract: "0x0000000000000000000000000000000000000001",
          },
          primaryType: "ReceiveWithAuthorization",
          message: { from: signerAddress },
        },
      },
    },
    signature: "0xabcd1234",
  };
};

describe("handleGaslessSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyTypedData.mockReturnValue(MOCK_SIGNER_ADDRESS);
  });

  it("returns depositId and messageId with valid signature", async () => {
    const body = createValidBody();
    const result = await handleGaslessSubmit({ body, requestId: "req-123" });

    expect(result).toEqual({
      depositId: "dep-123",
      messageId: MOCK_MESSAGE_ID,
    });
  });

  it("throws when swapTx.to does not match periphery address", async () => {
    const body = createValidBody();
    body.swapTx.to = "0x0000000000000000000000000000000000000001";

    await expect(
      handleGaslessSubmit({ body, requestId: "req-123" })
    ).rejects.toThrow(/Invalid target address/);
  });

  it("throws when signature recovery fails", async () => {
    mockVerifyTypedData.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const body = createValidBody();

    await expect(
      handleGaslessSubmit({ body, requestId: "req-123" })
    ).rejects.toThrow(/Invalid signature: unable to recover signer/);
  });

  it("throws when recovered signer does not match permit.message.from", async () => {
    const wrongSigner = "0x9999999999999999999999999999999999999999";
    mockVerifyTypedData.mockReturnValue(wrongSigner);

    const body = createValidBody();

    await expect(
      handleGaslessSubmit({ body, requestId: "req-123" })
    ).rejects.toThrow(/Signature mismatch/);
  });

  it("throws when permit.message.from does not match depositor", async () => {
    const differentDepositor = "0x8888888888888888888888888888888888888888";
    const body = createValidBody({ depositor: differentDepositor });

    await expect(
      handleGaslessSubmit({ body, requestId: "req-123" })
    ).rejects.toThrow(/permit.message.from must match depositor/);
  });

  it("extracts depositor from BridgeWitness correctly", async () => {
    const body = createValidBody({ witnessType: "BridgeWitness" });
    const result = await handleGaslessSubmit({ body, requestId: "req-123" });

    expect(result.depositId).toBe("dep-123");
  });

  it("extracts depositor from BridgeAndSwapWitness correctly", async () => {
    const body = createValidBody({ witnessType: "BridgeAndSwapWitness" });
    const result = await handleGaslessSubmit({ body, requestId: "req-123" });

    expect(result.depositId).toBe("dep-123");
  });
});
