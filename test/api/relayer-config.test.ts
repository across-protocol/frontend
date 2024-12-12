import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import * as utils from "../../api/_exclusivity/utils";
import {
  RelayerConfigUpdate,
  TypedRelayerConfigUpdateRequest,
} from "../../api/_types";
import handler from "../../api/relayer-config";
const { MAX_MESSAGE_AGE_SECONDS } = utils;

const getMockedResponse = () => {
  const response: any = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn();
  response.setHeader = jest.fn();
  return response as VercelResponse;
};

describe("Relayer Config API", () => {
  let response: VercelResponse;
  const whitelistedRelayer = ethers.Wallet.createRandom();
  const unauthorizedRelayer = ethers.Wallet.createRandom();

  beforeEach(() => {
    response = getMockedResponse();
    jest
      .spyOn(utils, "getWhiteListedRelayers")
      .mockReturnValue([whitelistedRelayer.address]);
  });

  test("POST request with valid timestamp", async () => {
    const message: RelayerConfigUpdate = {
      timestamp: Date.now() / 1000,
      relayerFillLimits: [
        {
          originChainId: "1",
          inputToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          destinationChainId: "42161",
          outputToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          minOutputAmount: "1",
          maxOutputAmount: "2",
          balanceMultiplier: "1",
          minProfitThreshold: "0.0001",
          minExclusivityPeriod: "1",
        },
      ],
    };
    const messageString = JSON.stringify(message);
    const signature = await whitelistedRelayer.signMessage(messageString);

    const request = {
      method: "POST",
      headers: {
        authorization: signature,
      },
      body: message,
    } as TypedRelayerConfigUpdateRequest;

    await handler(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
  });

  test("POST request with invalid timestamp", async () => {
    const message: RelayerConfigUpdate = {
      timestamp: Date.now() / 1000 - MAX_MESSAGE_AGE_SECONDS - 1,
      relayerFillLimits: [],
    };
    const signature = await whitelistedRelayer.signMessage(
      JSON.stringify(message)
    );

    const request = {
      method: "POST",
      headers: {
        authorization: signature,
      },
      body: message,
    } as TypedRelayerConfigUpdateRequest;

    await handler(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: "Message too old" });
  });

  test("POST request with invalid signature", async () => {
    const message: RelayerConfigUpdate = {
      timestamp: Date.now() / 1000,
      relayerFillLimits: [],
    };
    const signature = await unauthorizedRelayer.signMessage(
      JSON.stringify(message)
    );

    const request = {
      method: "POST",
      headers: {
        authorization: signature,
      },
      body: message,
    } as TypedRelayerConfigUpdateRequest;

    await handler(request, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });
});
