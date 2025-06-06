import { StructError } from "superstruct";
import { AxiosError, AxiosResponse } from "axios";
import { ethers } from "ethers";
import { VercelResponse } from "@vercel/node";
import { relayFeeCalculator } from "@across-protocol/sdk";
import {
  handleErrorCondition,
  AcrossApiError,
  InputError,
  SimulationError,
  AcrossErrorCode,
  HttpErrorToStatusCode,
} from "../../../api/_errors";

describe("Error handler tests", () => {
  let mockResponse: jest.Mocked<VercelResponse>;
  let mockLogger: jest.Mocked<relayFeeCalculator.Logger>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<VercelResponse>;

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<relayFeeCalculator.Logger>;
  });

  it("should handle Superstruct validation errors", () => {
    const structError = new StructError(
      {
        value: "invalid",
        type: "string",
        path: ["user", "name"],
        branch: [{ user: { name: "invalid" } }],
        key: "name",
        refinement: undefined,
        message: "Expected string",
      },
      () => {
        throw new Error("Expected string");
      }
    );

    handleErrorCondition(
      "test-endpoint",
      mockResponse,
      mockLogger,
      structError
    );

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpErrorToStatusCode.BAD_REQUEST
    );
    expect(mockResponse.json).toHaveBeenCalledWith(expect.any(InputError));
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("should handle Axios errors with upstream AcrossApiError", () => {
    const axiosError = new AxiosError(
      "Error message",
      "ERROR_CODE",
      undefined,
      undefined,
      {
        data: {
          type: "AcrossApiError",
          message: "Upstream error message",
          status: HttpErrorToStatusCode.BAD_REQUEST,
          code: AcrossErrorCode.INVALID_PARAM,
        },
        status: HttpErrorToStatusCode.BAD_REQUEST,
      } as AxiosResponse
    );

    handleErrorCondition("test-endpoint", mockResponse, mockLogger, axiosError);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpErrorToStatusCode.BAD_REQUEST
    );
    expect(mockResponse.json).toHaveBeenCalledWith(expect.any(AcrossApiError));
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("should handle Axios errors", () => {
    const axiosError = new AxiosError(
      "Error message",
      "ERROR_CODE",
      undefined,
      undefined,
      { status: HttpErrorToStatusCode.INTERNAL_SERVER_ERROR } as AxiosResponse
    );

    handleErrorCondition("test-endpoint", mockResponse, mockLogger, axiosError);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpErrorToStatusCode.BAD_GATEWAY
    );
    expect(mockResponse.json).toHaveBeenCalledWith(expect.any(AcrossApiError));
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it("should handle Ethers simulation errors", () => {
    const ethersError = {
      reason: '{"message":"execution reverted"}',
      code: ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT,
      method: "estimateGas",
      transaction: {
        from: "0x123",
        to: "0x456",
        data: "test data",
      },
    };

    handleErrorCondition(
      "test-endpoint",
      mockResponse,
      mockLogger,
      ethersError
    );

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpErrorToStatusCode.BAD_REQUEST
    );
    expect(mockResponse.json).toHaveBeenCalledWith(expect.any(SimulationError));
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("should handle AcrossApiError instances", () => {
    const acrossError = new InputError({
      message: "Test error",
      code: AcrossErrorCode.INVALID_PARAM,
    });

    handleErrorCondition(
      "test-endpoint",
      mockResponse,
      mockLogger,
      acrossError
    );

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpErrorToStatusCode.BAD_REQUEST
    );
    expect(mockResponse.json).toHaveBeenCalledWith(expect.any(InputError));
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("should handle generic errors", () => {
    const genericError = new Error("Generic error message");

    handleErrorCondition(
      "test-endpoint",
      mockResponse,
      mockLogger,
      genericError
    );

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpErrorToStatusCode.INTERNAL_SERVER_ERROR
    );
    expect(mockResponse.json).toHaveBeenCalledWith(expect.any(AcrossApiError));
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
