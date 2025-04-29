import { ethers } from "ethers";
import { relayFeeCalculator } from "@across-protocol/sdk";
import {
  populateDefaultRelayerFeeCapitalCostConfig,
  TOKEN_SYMBOLS_MAP,
} from "../../api/_constants";
import { ConvertDecimals } from "../../api/_utils";

describe("populateDefaultRelayerFeeCapitalCostConfig", () => {
  it("should populate decimals correctly for a single token", () => {
    const baseConfig = {
      ETH: {
        lowerBound: ethers.utils.parseUnits("0.0001", 18).toString(),
        upperBound: ethers.utils.parseUnits("0.000075", 18).toString(),
        cutoff: ethers.utils.parseUnits("0.3", 18).toString(),
      },
    };
    const expectedConfig: {
      [token: string]: relayFeeCalculator.CapitalCostConfig;
    } = {
      ETH: {
        ...baseConfig.ETH,
        decimals: 18,
      },
    };

    const result = populateDefaultRelayerFeeCapitalCostConfig(baseConfig);
    expect(result).toEqual(expectedConfig);
  });

  it("should populate config for equivalent tokens with correct decimal conversion", () => {
    const usdcBaseConfig = {
      lowerBound: ethers.utils.parseUnits("0.0001").toString(),
      upperBound: ethers.utils.parseUnits("0.0001").toString(),
      cutoff: ethers.utils.parseUnits("100000").toString(), // Represents 100k USDC (6 decimals)
    };
    const baseConfig: Record<
      string,
      Omit<relayFeeCalculator.CapitalCostConfig, "decimals">
    > = {
      USDC: usdcBaseConfig,
    };

    const usdcDecimals = TOKEN_SYMBOLS_MAP.USDC.decimals; // 6
    const usdcBnbDecimals = TOKEN_SYMBOLS_MAP["USDC-BNB"].decimals; // 18
    const tataraUsdsDecimals = TOKEN_SYMBOLS_MAP["TATARA-USDS"].decimals; // 18

    // Original cutoff value parsed with USDC decimals (6)
    const originalCutoffValue = ethers.utils.parseUnits(
      usdcBaseConfig.cutoff,
      usdcDecimals
    );

    // Expected cutoff value for tokens with 18 decimals
    const convertedCutoff18Decimals = ConvertDecimals(
      usdcDecimals,
      usdcBnbDecimals
    )(originalCutoffValue).toString();
    // Expected cutoff value for tokens with 6 decimals (should be the same as original parsed value)
    const convertedCutoff6Decimals = ConvertDecimals(
      usdcDecimals,
      usdcDecimals
    )(originalCutoffValue).toString();

    const result = populateDefaultRelayerFeeCapitalCostConfig(baseConfig);

    // Check base USDC config
    expect(result.USDC).toEqual({
      ...usdcBaseConfig,
      decimals: usdcDecimals,
      cutoff: convertedCutoff6Decimals, // Should match the original value parsed with 6 decimals
    });

    // Check some equivalent tokens
    // USDC.e (6 decimals)
    expect(result["USDC.e"]).toEqual({
      ...usdcBaseConfig,
      decimals: TOKEN_SYMBOLS_MAP["USDC.e"].decimals,
      cutoff: convertedCutoff6Decimals,
    });
    // USDC-BNB (18 decimals)
    expect(result["USDC-BNB"]).toEqual({
      ...usdcBaseConfig,
      decimals: usdcBnbDecimals,
      cutoff: convertedCutoff18Decimals, // Check conversion
    });
    // TATARA-USDS (18 decimals)
    expect(result["TATARA-USDS"]).toEqual({
      ...usdcBaseConfig,
      decimals: tataraUsdsDecimals,
      cutoff: convertedCutoff18Decimals, // Check conversion
    });
    // TATARA-USDC (6 decimals)
    expect(result["TATARA-USDC"]).toEqual({
      ...usdcBaseConfig,
      decimals: TOKEN_SYMBOLS_MAP["TATARA-USDC"].decimals,
      cutoff: convertedCutoff6Decimals,
    });

    // Ensure all expected equivalents are present
    const expectedEquivalents = [
      "USDC.e",
      "USDC-BNB",
      "USDzC",
      "TATARA-USDC",
      "TATARA-USDT",
      "TATARA-USDS",
    ];
    expectedEquivalents.forEach((eqSymbol) => {
      expect(result[eqSymbol]).toBeDefined();
    });
  });

  it("should throw an error if a base token symbol is not found", () => {
    const baseConfig = {
      UNKNOWN_TOKEN: {
        lowerBound: "1",
        upperBound: "2",
        cutoff: "3",
      },
    };

    expect(() =>
      populateDefaultRelayerFeeCapitalCostConfig(baseConfig)
    ).toThrow(
      "Can't populate capital cost config for UNKNOWN_TOKEN: token not found"
    );
  });

  // Note: Testing for errors when an *equivalent* token listed in
  // `tokensWithSameConfig` is not found in `TOKEN_SYMBOLS_MAP`
  // would require modifying the constants, which is outside the scope
  // of testing this function's input validation.
});
