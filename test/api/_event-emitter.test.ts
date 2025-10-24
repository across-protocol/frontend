import { ethers } from "ethers";
import { CHAIN_IDs } from "@across-protocol/constants";

import {
  ACROSS_EVENT_EMITTER_ADDRESS,
  getEventEmitterAddress,
  isEventEmitterDeployed,
  encodeSwapMetadata,
  encodeEmitDataCalldata,
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

  describe("isEventEmitterDeployed", () => {
    it("should return false for zero address", () => {
      const deployed = isEventEmitterDeployed(CHAIN_IDs.MAINNET);
      expect(deployed).toBe(false);
    });

    it("should return true for non-zero address", () => {
      // Temporarily set a non-zero address
      ACROSS_EVENT_EMITTER_ADDRESS[CHAIN_IDs.ARBITRUM] =
        "0x1111111111111111111111111111111111111111";
      const deployed = isEventEmitterDeployed(CHAIN_IDs.ARBITRUM);
      expect(deployed).toBe(true);
      // Reset
      ACROSS_EVENT_EMITTER_ADDRESS[CHAIN_IDs.ARBITRUM] =
        ethers.constants.AddressZero;
    });

    it("should return false for unknown chain ID", () => {
      const deployed = isEventEmitterDeployed(999999);
      expect(deployed).toBe(false);
    });
  });

  describe("encodeSwapMetadata", () => {
    it("should encode metadata with all required fields", () => {
      const metadata = encodeSwapMetadata({
        version: 1,
        swapTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
        swapTokenAmount: ethers.utils.parseEther("1.5"),
        recipient: "0x1111111111111111111111111111111111111111",
        appFeeRecipient: "0x2222222222222222222222222222222222222222",
        swapProvider: "Uniswap V3",
      });

      expect(metadata).toBeDefined();
      expect(metadata.startsWith("0x")).toBe(true);
      expect(metadata.length).toBeGreaterThan(2);

      // Decode and verify
      const abiCoder = ethers.utils.defaultAbiCoder;
      const decoded = abiCoder.decode(
        ["uint8", "address", "uint256", "address", "address", "string"],
        metadata
      );

      expect(decoded[0]).toBe(1); // version
      expect(decoded[1].toLowerCase()).toBe(
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase()
      ); // swapTokenAddress
      expect(decoded[2]).toEqual(ethers.utils.parseEther("1.5")); // swapTokenAmount
      expect(decoded[3].toLowerCase()).toBe(
        "0x1111111111111111111111111111111111111111".toLowerCase()
      ); // recipient
      expect(decoded[4].toLowerCase()).toBe(
        "0x2222222222222222222222222222222222222222".toLowerCase()
      ); // appFeeRecipient
      expect(decoded[5]).toBe("Uniswap V3"); // swapProvider
    });

    it("should handle zero address for appFeeRecipient", () => {
      const metadata = encodeSwapMetadata({
        version: 1,
        swapTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        swapTokenAmount: ethers.utils.parseEther("1"),
        recipient: "0x1111111111111111111111111111111111111111",
        appFeeRecipient: ethers.constants.AddressZero,
        swapProvider: "0x",
      });

      const abiCoder = ethers.utils.defaultAbiCoder;
      const decoded = abiCoder.decode(
        ["uint8", "address", "uint256", "address", "address", "string"],
        metadata
      );

      expect(decoded[4]).toBe(ethers.constants.AddressZero);
    });

    it("should handle different swap providers", () => {
      const providers = ["Uniswap V3", "0x", "1inch", "Jupiter"];

      providers.forEach((provider) => {
        const metadata = encodeSwapMetadata({
          version: 1,
          swapTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
          swapTokenAmount: ethers.utils.parseEther("1"),
          recipient: "0x1111111111111111111111111111111111111111",
          appFeeRecipient: ethers.constants.AddressZero,
          swapProvider: provider,
        });

        const abiCoder = ethers.utils.defaultAbiCoder;
        const decoded = abiCoder.decode(
          ["uint8", "address", "uint256", "address", "address", "string"],
          metadata
        );

        expect(decoded[5]).toBe(provider);
      });
    });

    it("should handle different token amounts", () => {
      const amounts = [
        ethers.utils.parseUnits("1", 6), // 1 USDC
        ethers.utils.parseEther("0.001"), // 0.001 ETH
        ethers.utils.parseEther("1000"), // 1000 tokens
        ethers.BigNumber.from("1"), // 1 wei
      ];

      amounts.forEach((amount) => {
        const metadata = encodeSwapMetadata({
          version: 1,
          swapTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
          swapTokenAmount: amount,
          recipient: "0x1111111111111111111111111111111111111111",
          appFeeRecipient: ethers.constants.AddressZero,
          swapProvider: "Test",
        });

        const abiCoder = ethers.utils.defaultAbiCoder;
        const decoded = abiCoder.decode(
          ["uint8", "address", "uint256", "address", "address", "string"],
          metadata
        );

        expect(decoded[2]).toEqual(amount);
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
        swapTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        swapTokenAmount: ethers.utils.parseEther("1"),
        recipient: "0x1111111111111111111111111111111111111111",
        appFeeRecipient: "0x2222222222222222222222222222222222222222",
        swapProvider: "Uniswap V3",
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
        ["uint8", "address", "uint256", "address", "address", "string"],
        decodedCalldata.data
      );

      // Verify all fields
      expect(decodedMetadata[0]).toBe(1); // version
      expect(decodedMetadata[1].toLowerCase()).toBe(
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase()
      );
      expect(decodedMetadata[2]).toEqual(ethers.utils.parseEther("1"));
      expect(decodedMetadata[3].toLowerCase()).toBe(
        "0x1111111111111111111111111111111111111111".toLowerCase()
      );
      expect(decodedMetadata[4].toLowerCase()).toBe(
        "0x2222222222222222222222222222222222222222".toLowerCase()
      );
      expect(decodedMetadata[5]).toBe("Uniswap V3");
    });
  });

  describe("Integration: Full encoding flow", () => {
    it("should encode metadata that can be used in MulticallHandler", () => {
      // This simulates the full flow of encoding metadata for the event emitter
      const swapMetadata = encodeSwapMetadata({
        version: 1,
        swapTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        swapTokenAmount: ethers.utils.parseEther("2.5"),
        recipient: "0x1111111111111111111111111111111111111111",
        appFeeRecipient: "0x2222222222222222222222222222222222222222",
        swapProvider: "0x",
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
        ["uint8", "address", "uint256", "address", "address", "string"],
        decodedCalldata.data
      );

      expect(decodedMetadata[0]).toBe(1);
      expect(decodedMetadata[5]).toBe("0x");
      expect(decodedMetadata[2]).toEqual(ethers.utils.parseEther("2.5"));
    });
  });
});
