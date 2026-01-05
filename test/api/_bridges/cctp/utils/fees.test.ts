import { BigNumber } from "ethers";
import axios from "axios";

import { getCctpFees } from "../../../../../api/_bridges/cctp/utils/fees";
import { CHAIN_IDs } from "../../../../../api/_constants";
import { TOKEN_SYMBOLS_MAP } from "../../../../../api/_constants";

jest.mock("axios");

describe("bridges/cctp/utils/fees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("#getCctpFees()", () => {
    const mockAxios = axios as jest.Mocked<typeof axios>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    // Mock Circle API response with multiple finality threshold configs
    const mockCctpFeeResponse = [
      {
        finalityThreshold: 1000, // fast
        minimumFee: 1, // 1 bps = 0.01%
        forwardFee: {
          low: 100000,
          med: 200000, // 0.2 USDC (in 6 decimals)
          high: 300000,
        },
      },
      {
        finalityThreshold: 2000, // standard
        minimumFee: 2, // 2 bps = 0.02%
        forwardFee: {
          low: 150000,
          med: 250000, // 0.25 USDC
          high: 350000,
        },
      },
    ];

    describe("HyperCore destinations (mainnet)", () => {
      const inputToken = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
        chainId: CHAIN_IDs.BASE,
      };

      const outputTokenHyperCore = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
        chainId: CHAIN_IDs.HYPERCORE,
      };

      test("should query with forward=true and extract forward fee from API response", async () => {
        mockAxios.get.mockResolvedValue({ data: mockCctpFeeResponse });

        const result = await getCctpFees({
          inputToken,
          outputToken: outputTokenHyperCore,
          transferMode: "fast",
          useForwardFee: true,
        });

        // Verify API call parameters
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining("iris-api.circle.com/v2/burn/USDC/fees/"),
          expect.objectContaining({
            params: { forward: true },
          })
        );

        // Verify returned fee breakdown
        expect(result.transferFeeBps).toEqual(1);
        expect(result.forwardFee).toEqual(BigNumber.from(200000));
      });
    });

    describe("HyperCore destinations (testnet)", () => {
      const inputToken = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE_SEPOLIA],
        chainId: CHAIN_IDs.BASE_SEPOLIA,
      };

      const outputTokenHyperCoreTestnet = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE_TESTNET],
        chainId: CHAIN_IDs.HYPERCORE_TESTNET,
      };

      test("should use sandbox endpoint for testnet and extract forward fee", async () => {
        mockAxios.get.mockResolvedValue({ data: mockCctpFeeResponse });

        const result = await getCctpFees({
          inputToken,
          outputToken: outputTokenHyperCoreTestnet,
          transferMode: "fast",
          useSandbox: true,
        });

        // Verify sandbox endpoint is used
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(
            "iris-api-sandbox.circle.com/v2/burn/USDC/fees/"
          ),
          expect.objectContaining({
            params: { forward: true },
          })
        );

        // Verify forward fee is extracted
        expect(result.transferFeeBps).toEqual(1);
        expect(result.forwardFee).toEqual(BigNumber.from(200000));
      });
    });

    describe("Non-HyperCore destinations", () => {
      const inputToken = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
        chainId: CHAIN_IDs.BASE,
      };

      const outputTokenBase = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
        chainId: CHAIN_IDs.OPTIMISM,
      };

      test("should query without forward parameter and set forwardFee to 0", async () => {
        mockAxios.get.mockResolvedValue({ data: mockCctpFeeResponse });

        const result = await getCctpFees({
          inputToken,
          outputToken: outputTokenBase,
          transferMode: "standard",
        });

        // Verify API call does NOT include forward parameter
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining("iris-api.circle.com/v2/burn/USDC/fees/"),
          expect.objectContaining({
            params: undefined,
          })
        );

        // Verify forward fee is 0
        expect(result.transferFeeBps).toEqual(2);
        expect(result.forwardFee).toEqual(BigNumber.from(0));
      });
    });
  });
});
