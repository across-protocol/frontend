import { ethers } from "ethers";
import { CHAIN_IDs } from "@across-protocol/constants";

import {
  getEventEmitterAddress,
  encodeSwapMetadata,
  encodeEmitDataCalldata,
  SwapType,
  SwapSide,
} from "../../api/_event-emitter";

describe("Event Emitter Module", () => {
  describe("getEventEmitterAddress", () => {
    it("should return address for valid chain ID", () => {
      const address = getEventEmitterAddress(CHAIN_IDs.ARBITRUM);
      expect(address).toBeDefined();
      expect(typeof address).toBe("string");
    });

    it("should return undefined for unknown chain ID", () => {
      const address = getEventEmitterAddress(999999);
      expect(address).toBeUndefined();
    });
  });

  describe("encodeSwapMetadata", () => {
    it("should encode metadata with all required fields", () => {
      const metadata = encodeSwapMetadata({
        version: 1,
        type: SwapType.EXACT_INPUT,
        side: SwapSide.ORIGIN_AND_DESTINATION_SWAPS,
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
        expectedAmount: ethers.utils.parseEther("2.0"),
        minAmount: ethers.utils.parseEther("1.5"),
        swapProvider: "Uniswap V3",
        slippage: ethers.BigNumber.from(50), // 0.5%
        autoSlippage: true,
        recipient: "0x1111111111111111111111111111111111111111",
        appFeeRecipient: "0x2222222222222222222222222222222222222222",
      });

      expect(metadata).toBeDefined();
      expect(metadata.startsWith("0x")).toBe(true);
      expect(metadata.length).toBeGreaterThan(2);

      // Decode and verify
      const abiCoder = ethers.utils.defaultAbiCoder;
      const decoded = abiCoder.decode(
        [
          "uint8",
          "uint8",
          "uint8",
          "address",
          "uint256",
          "uint256",
          "string",
          "uint256",
          "bool",
          "address",
          "address",
        ],
        metadata
      );

      expect(decoded[0]).toBe(1); // version
      expect(decoded[1]).toBe(SwapType.EXACT_INPUT); // type
      expect(decoded[2]).toBe(SwapSide.ORIGIN_AND_DESTINATION_SWAPS); // side
      expect(decoded[3].toLowerCase()).toBe(
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase()
      ); // address
      expect(decoded[4]).toEqual(ethers.utils.parseEther("2.0")); // expectedAmount
      expect(decoded[5]).toEqual(ethers.utils.parseEther("1.5")); // minAmount
      expect(decoded[6]).toBe("Uniswap V3"); // swapProvider
      expect(decoded[7]).toEqual(ethers.BigNumber.from(50)); // slippage
      expect(decoded[8]).toBe(true); // autoSlippage
      expect(decoded[9].toLowerCase()).toBe(
        "0x1111111111111111111111111111111111111111".toLowerCase()
      ); // recipient
      expect(decoded[10].toLowerCase()).toBe(
        "0x2222222222222222222222222222222222222222".toLowerCase()
      ); // appFeeRecipient
    });

    it("should handle zero address for appFeeRecipient", () => {
      const metadata = encodeSwapMetadata({
        version: 1,
        type: SwapType.EXACT_OUTPUT,
        side: SwapSide.DESTINATION_SWAP,
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        expectedAmount: ethers.utils.parseEther("1.1"),
        minAmount: ethers.utils.parseEther("1"),
        swapProvider: "0x",
        slippage: ethers.BigNumber.from(100), // 1%
        autoSlippage: false,
        recipient: "0x1111111111111111111111111111111111111111",
        appFeeRecipient: ethers.constants.AddressZero,
      });

      const abiCoder = ethers.utils.defaultAbiCoder;
      const decoded = abiCoder.decode(
        [
          "uint8",
          "uint8",
          "uint8",
          "address",
          "uint256",
          "uint256",
          "string",
          "uint256",
          "bool",
          "address",
          "address",
        ],
        metadata
      );

      expect(decoded[10]).toBe(ethers.constants.AddressZero);
    });

    it("should handle different swap providers", () => {
      const providers = ["Uniswap V3", "0x", "1inch", "Jupiter"];

      providers.forEach((provider) => {
        const metadata = encodeSwapMetadata({
          version: 1,
          type: SwapType.EXACT_INPUT,
          side: SwapSide.DESTINATION_SWAP,
          address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
          expectedAmount: ethers.utils.parseEther("1.05"),
          minAmount: ethers.utils.parseEther("1"),
          swapProvider: provider,
          slippage: ethers.BigNumber.from(50),
          autoSlippage: false,
          recipient: "0x1111111111111111111111111111111111111111",
          appFeeRecipient: ethers.constants.AddressZero,
        });

        const abiCoder = ethers.utils.defaultAbiCoder;
        const decoded = abiCoder.decode(
          [
            "uint8",
            "uint8",
            "uint8",
            "address",
            "uint256",
            "uint256",
            "string",
            "uint256",
            "bool",
            "address",
            "address",
          ],
          metadata
        );

        expect(decoded[6]).toBe(provider);
      });
    });

    it("should handle different token amounts", () => {
      const amounts = [
        ethers.utils.parseUnits("1", 6), // 1 USDC
        ethers.utils.parseEther("0.001"), // 0.001 ETH
        ethers.utils.parseEther("1000"), // 1000 tokens
        ethers.BigNumber.from("1"), // 1 wei
      ];

      amounts.forEach((minAmount) => {
        const expectedAmount = minAmount.mul(110).div(100); // 10% higher
        const metadata = encodeSwapMetadata({
          version: 1,
          type: SwapType.EXACT_INPUT,
          side: SwapSide.ORIGIN_AND_DESTINATION_SWAPS,
          address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
          expectedAmount,
          minAmount,
          swapProvider: "Test",
          slippage: ethers.BigNumber.from(100), // 1%
          autoSlippage: false,
          recipient: "0x1111111111111111111111111111111111111111",
          appFeeRecipient: ethers.constants.AddressZero,
        });

        const abiCoder = ethers.utils.defaultAbiCoder;
        const decoded = abiCoder.decode(
          [
            "uint8",
            "uint8",
            "uint8",
            "address",
            "uint256",
            "uint256",
            "string",
            "uint256",
            "bool",
            "address",
            "address",
          ],
          metadata
        );

        expect(decoded[4]).toEqual(expectedAmount); // expectedAmount
        expect(decoded[5]).toEqual(minAmount); // minAmount
      });
    });
  });

  describe("encodeEmitDataCalldata", () => {
    it("should encode calldata with correct function selector", () => {
      const testData = "0x1234567890abcdef";
      const calldata = encodeEmitDataCalldata(testData);

      expect(calldata).toBeDefined();
      expect(calldata.startsWith("0x")).toBe(true);

      // Check function selector (first 4 bytes)
      const selector = calldata.slice(0, 10);
      const expectedSelector = ethers.utils.id("emitData(bytes)").slice(0, 10);
      expect(selector).toBe(expectedSelector);
    });

    it("should correctly encode and decode data parameter", () => {
      const testData = "0xabcdef1234567890";
      const calldata = encodeEmitDataCalldata(testData);

      // Decode it back
      const emitDataInterface = new ethers.utils.Interface([
        "function emitData(bytes calldata data)",
      ]);
      const decoded = emitDataInterface.decodeFunctionData(
        "emitData",
        calldata
      );

      expect(decoded.data).toBe(testData);
    });

    it("should handle full metadata encoding in calldata", () => {
      // First encode the metadata
      const metadata = encodeSwapMetadata({
        version: 1,
        type: SwapType.EXACT_OUTPUT,
        side: SwapSide.DESTINATION_SWAP,
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        expectedAmount: ethers.utils.parseEther("1.1"),
        minAmount: ethers.utils.parseEther("1"),
        swapProvider: "Uniswap V3",
        slippage: ethers.BigNumber.from(100),
        autoSlippage: true,
        recipient: "0x1111111111111111111111111111111111111111",
        appFeeRecipient: "0x2222222222222222222222222222222222222222",
      });

      // Then encode it as calldata
      const calldata = encodeEmitDataCalldata(metadata);

      // Decode the calldata
      const emitDataInterface = new ethers.utils.Interface([
        "function emitData(bytes calldata data)",
      ]);
      const decodedCalldata = emitDataInterface.decodeFunctionData(
        "emitData",
        calldata
      );

      // Decode the inner metadata
      const abiCoder = ethers.utils.defaultAbiCoder;
      const decodedMetadata = abiCoder.decode(
        [
          "uint8",
          "uint8",
          "uint8",
          "address",
          "uint256",
          "uint256",
          "string",
          "uint256",
          "bool",
          "address",
          "address",
        ],
        decodedCalldata.data
      );

      // Verify all fields
      expect(decodedMetadata[0]).toBe(1); // version
      expect(decodedMetadata[1]).toBe(SwapType.EXACT_OUTPUT); // type
      expect(decodedMetadata[2]).toBe(SwapSide.DESTINATION_SWAP); // side
      expect(decodedMetadata[3].toLowerCase()).toBe(
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase()
      );
      expect(decodedMetadata[4]).toEqual(ethers.utils.parseEther("1.1")); // expectedAmount
      expect(decodedMetadata[5]).toEqual(ethers.utils.parseEther("1")); // minAmount
      expect(decodedMetadata[6]).toBe("Uniswap V3"); // swapProvider
      expect(decodedMetadata[7]).toEqual(ethers.BigNumber.from(100)); // slippage
      expect(decodedMetadata[8]).toBe(true); // autoSlippage
      expect(decodedMetadata[9].toLowerCase()).toBe(
        "0x1111111111111111111111111111111111111111".toLowerCase()
      );
      expect(decodedMetadata[10].toLowerCase()).toBe(
        "0x2222222222222222222222222222222222222222".toLowerCase()
      );
    });
  });

  describe("Integration: Full encoding flow", () => {
    it("should encode metadata that can be used in MulticallHandler", () => {
      // This simulates the full flow of encoding metadata for the event emitter
      const swapMetadata = encodeSwapMetadata({
        version: 1,
        type: SwapType.EXACT_INPUT,
        side: SwapSide.ORIGIN_AND_DESTINATION_SWAPS,
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        expectedAmount: ethers.utils.parseEther("2.8"),
        minAmount: ethers.utils.parseEther("2.5"),
        swapProvider: "0x",
        slippage: ethers.BigNumber.from(120), // 1.2%
        autoSlippage: false,
        recipient: "0x1111111111111111111111111111111111111111",
        appFeeRecipient: "0x2222222222222222222222222222222222222222",
      });

      const emitDataCalldata = encodeEmitDataCalldata(swapMetadata);

      // Verify the calldata can be decoded
      const emitDataInterface = new ethers.utils.Interface([
        "function emitData(bytes calldata data)",
      ]);
      const decodedCalldata = emitDataInterface.decodeFunctionData(
        "emitData",
        emitDataCalldata
      );

      // Verify the inner metadata
      const abiCoder = ethers.utils.defaultAbiCoder;
      const decodedMetadata = abiCoder.decode(
        [
          "uint8",
          "uint8",
          "uint8",
          "address",
          "uint256",
          "uint256",
          "string",
          "uint256",
          "bool",
          "address",
          "address",
        ],
        decodedCalldata.data
      );

      expect(decodedMetadata[0]).toBe(1); // version
      expect(decodedMetadata[1]).toBe(SwapType.EXACT_INPUT); // type
      expect(decodedMetadata[2]).toBe(SwapSide.ORIGIN_AND_DESTINATION_SWAPS); // side
      expect(decodedMetadata[6]).toBe("0x"); // swapProvider
      expect(decodedMetadata[4]).toEqual(ethers.utils.parseEther("2.8")); // expectedAmount
      expect(decodedMetadata[5]).toEqual(ethers.utils.parseEther("2.5")); // minAmount
      expect(decodedMetadata[7]).toEqual(ethers.BigNumber.from(120)); // slippage
      expect(decodedMetadata[8]).toBe(false); // autoSlippage
    });
  });
});
