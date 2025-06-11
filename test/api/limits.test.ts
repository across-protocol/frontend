import { BigNumber } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { VercelResponse } from "@vercel/node";
import limitsHandler from "../../api/limits";
import { TypedVercelRequest } from "../../api/_types";
import * as limitsHelper from "../../api/helpers/limits-helper";
import * as utils from "../../api/_utils";
import * as relayerAddress from "../../api/_relayer-address";
import * as gas from "../../api/_gas";

jest.mock("../../api/helpers/limits-helper");
jest.mock("../../api/_utils");
jest.mock("../../api/_relayer-address");
jest.mock("../../api/_gas");

describe("Limits Handler", () => {
  const MAINNET_TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC on mainnet
  const BASE_TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
  const OPTIMISM_TOKEN_ADDRESS = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"; // USDC on Optimism
  const RELAYER_ADDRESS = "0x1234567890123456789012345678901234567890";
  const RECIPIENT_ADDRESS = "0x0987654321098765432109876543210987654321";

  let mockRequest: TypedVercelRequest<any>;
  let mockResponse: VercelResponse;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      debug: jest.fn(),
    };
    (utils.getLogger as jest.Mock).mockReturnValue(mockLogger);

    mockRequest = {
      query: {
        destinationChainId: "10", // Optimism
        originChainId: "8453", // Base
        token: MAINNET_TOKEN_ADDRESS,
        inputToken: BASE_TOKEN_ADDRESS,
        outputToken: OPTIMISM_TOKEN_ADDRESS,
      },
    } as unknown as TypedVercelRequest<any>;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    } as unknown as VercelResponse;

    setupDefaultMocks();
  });

  function setupDefaultMocks() {
    (limitsHelper.validateAndInitialize as jest.Mock).mockResolvedValue({
      provider: {},
      destinationChainId: 10, // Optimism
      computedOriginChainId: 8453, // Base
      l1Token: { address: MAINNET_TOKEN_ADDRESS, decimals: 6, symbol: "USDC" },
      inputToken: { address: BASE_TOKEN_ADDRESS, decimals: 6, symbol: "USDC" },
      outputToken: {
        address: OPTIMISM_TOKEN_ADDRESS,
        decimals: 6,
        symbol: "USDC",
      },
      amount: BigNumber.from("1000000"),
      recipient: sdk.utils.toAddressType(RECIPIENT_ADDRESS),
      relayer: sdk.utils.toAddressType(RELAYER_ADDRESS),
      isMessageDefined: false,
      minDepositUsdForDestinationChainId: 1,
    });

    (relayerAddress.getFullRelayers as jest.Mock).mockReturnValue([
      RELAYER_ADDRESS,
    ]);
    (relayerAddress.getTransferRestrictedRelayers as jest.Mock).mockReturnValue(
      []
    );

    (limitsHelper.setupMulticall as jest.Mock).mockReturnValue({
      multiCalls: [],
    });

    (limitsHelper.setupDepositAndGas as jest.Mock).mockReturnValue({
      depositArgs: {},
      shouldUseUnsignedFillForGasPriceCache: false,
    });

    (limitsHelper.fetchTokenAndGasPrices as jest.Mock).mockResolvedValue({
      tokenPriceNative: 1,
      tokenPriceUsd: BigNumber.from("1000000000000000000"),
      latestBlock: { number: 1 },
      gasPriceEstimate: {},
      nativeGasCost: BigNumber.from("1000000000000000000"),
    });

    (limitsHelper.processRelayerBalances as jest.Mock).mockResolvedValue({
      _liquidReserves: BigNumber.from("1000000"),
      fullRelayerBalances: [BigNumber.from("1000000")],
      transferRestrictedBalances: [],
      transferBalances: [BigNumber.from("1000000")],
      routeInvolvesLiteChain: false,
      routeInvolvesUltraLightChain: false,
    });

    (gas.calcGasFeeDetails as jest.Mock).mockReturnValue({
      nativeGasCost: BigNumber.from("1000000000000000000"),
      opStackL1GasCost: BigNumber.from("1000000000000000000"),
      gasPrice: BigNumber.from("1000000000000000000"),
      tokenGasCost: BigNumber.from("1000000"),
    });

    (utils.getRelayerFeeDetails as jest.Mock).mockResolvedValue({
      relayFeeTotal: "1000000",
      relayFeePercent: "1",
      gasFeeTotal: "1000000",
      gasFeePercent: "1",
      capitalFeeTotal: "1000000",
      capitalFeePercent: "1",
      minDeposit: "1000000",
    });

    (limitsHelper.getDepositLimits as jest.Mock).mockReturnValue({
      minDeposit: BigNumber.from("1000000"),
      minDepositFloor: BigNumber.from("1000000"),
      maxDepositInstant: BigNumber.from("1000000"),
      maxDepositShortDelay: BigNumber.from("1000000"),
      liquidReserves: BigNumber.from("1000000"),
    });

    (
      limitsHelper.processChainBoundariesAndDeposits as jest.Mock
    ).mockResolvedValue({
      minDeposit: BigNumber.from("1000000"),
      minDepositFloor: BigNumber.from("1000000"),
      maxDepositInstant: BigNumber.from("1000000"),
      maxDepositShortDelay: BigNumber.from("1000000"),
      maximumDeposit: BigNumber.from("1000000"),
    });

    (utils.getLimitCap as jest.Mock).mockReturnValue(BigNumber.from("1000000"));

    (
      limitsHelper.convertRelayerBalancesToInputDecimals as jest.Mock
    ).mockReturnValue({
      convertedLiquidReserves: BigNumber.from("1000000"),
      convertedFullRelayerBalances: [BigNumber.from("1000000")],
      convertedTransferRestrictedBalances: [],
      convertedTransferBalances: [BigNumber.from("1000000")],
    });
  }

  test("handles route with lite chain", async () => {
    (limitsHelper.processRelayerBalances as jest.Mock).mockResolvedValue({
      _liquidReserves: BigNumber.from("1000000"),
      fullRelayerBalances: [BigNumber.from("1000000")],
      transferRestrictedBalances: [],
      transferBalances: [BigNumber.from("1000000")],
      routeInvolvesLiteChain: true,
      routeInvolvesUltraLightChain: false,
    });

    await limitsHandler(mockRequest, mockResponse);

    expect(limitsHelper.getDepositLimits).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Object),
      expect.any(Array),
      expect.any(Array),
      expect.any(Array),
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Number),
      true,
      false
    );

    expect(limitsHelper.processChainBoundariesAndDeposits).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Number),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      true,
      false
    );
  });

  test("handles route with ultra light chain", async () => {
    (limitsHelper.processRelayerBalances as jest.Mock).mockResolvedValue({
      _liquidReserves: BigNumber.from("1000000"),
      fullRelayerBalances: [BigNumber.from("1000000")],
      transferRestrictedBalances: [],
      transferBalances: [BigNumber.from("1000000")],
      routeInvolvesLiteChain: false,
      routeInvolvesUltraLightChain: true,
    });

    await limitsHandler(mockRequest, mockResponse);

    expect(limitsHelper.getDepositLimits).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Object),
      expect.any(Array),
      expect.any(Array),
      expect.any(Array),
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Number),
      false,
      true
    );

    expect(limitsHelper.processChainBoundariesAndDeposits).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Number),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      false,
      true
    );
  });

  test("handles missing gas fee details", async () => {
    (gas.calcGasFeeDetails as jest.Mock).mockReturnValue(undefined);

    await limitsHandler(mockRequest, mockResponse);

    expect(utils.getRelayerFeeDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Number),
      expect.any(String),
      undefined,
      expect.any(Object),
      undefined
    );
  });

  test("handles transfer restricted relayers", async () => {
    const transferRestrictedRelayers = [RELAYER_ADDRESS];
    (relayerAddress.getTransferRestrictedRelayers as jest.Mock).mockReturnValue(
      transferRestrictedRelayers
    );

    (
      limitsHelper.convertRelayerBalancesToInputDecimals as jest.Mock
    ).mockReturnValue({
      convertedLiquidReserves: BigNumber.from("1000000"),
      convertedFullRelayerBalances: [BigNumber.from("1000000")],
      convertedTransferRestrictedBalances: [BigNumber.from("500000")],
      convertedTransferBalances: [BigNumber.from("1000000")],
    });

    await limitsHandler(mockRequest, mockResponse);

    expect(limitsHelper.processRelayerBalances).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Number),
      expect.any(Array),
      transferRestrictedRelayers,
      expect.any(Array),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    );

    expect(limitsHelper.getDepositLimits).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Object),
      expect.any(Array),
      [BigNumber.from("500000")],
      expect.any(Array),
      expect.any(Object),
      expect.any(Object),
      expect.any(Number),
      expect.any(Number),
      false,
      false
    );
  });

  test("handles different token decimals", async () => {
    (limitsHelper.validateAndInitialize as jest.Mock).mockResolvedValue({
      provider: {},
      destinationChainId: 10,
      computedOriginChainId: 8453,
      l1Token: { address: MAINNET_TOKEN_ADDRESS, decimals: 6, symbol: "USDC" },
      inputToken: { address: BASE_TOKEN_ADDRESS, decimals: 6, symbol: "USDC" },
      outputToken: {
        address: OPTIMISM_TOKEN_ADDRESS,
        decimals: 18,
        symbol: "WETH",
      },
      amount: BigNumber.from("1000000"),
      recipient: sdk.utils.toAddressType(RECIPIENT_ADDRESS),
      relayer: sdk.utils.toAddressType(RELAYER_ADDRESS),
      isMessageDefined: false,
      minDepositUsdForDestinationChainId: 1,
    });

    await limitsHandler(mockRequest, mockResponse);

    expect(
      limitsHelper.convertRelayerBalancesToInputDecimals
    ).toHaveBeenCalledWith(expect.any(Object), {
      l1TokenDecimals: 6,
      inputTokenDecimals: 6,
      outputTokenDecimals: 18,
    });
  });
});
