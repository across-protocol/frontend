import handler from "../../api/relayer-config";
import { RelayerFillLimit, TypedVercelRequest } from "../../api/_types";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import * as utils from "../../api/_exclusivity/utils";
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
    const message = {
      timestamp: Date.now() / 1000,
    };
    const messageString = JSON.stringify(message);
    const signature = await whitelistedRelayer.signMessage(messageString);

    const request = {
      method: "POST",
      headers: {
        signature: signature,
      },
      body: {
        message: messageString,
      },
    } as TypedVercelRequest<RelayerFillLimit[]>;

    await handler(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
  });

  test("POST request with invalid timestamp", async () => {
    const message = {
      timestamp: Date.now() / 1000 - MAX_MESSAGE_AGE_SECONDS - 1,
    };
    const signature = await whitelistedRelayer.signMessage(
      JSON.stringify(message)
    );

    const request = {
      method: "POST",
      headers: {
        signature: signature,
      },
      body: {
        message: JSON.stringify(message),
      },
    } as TypedVercelRequest<RelayerFillLimit[]>;

    await handler(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: "Message too old" });
  });

  test("POST request with invalid signature", async () => {
    const message = {
      timestamp: Date.now() / 1000,
    };
    const signature = await unauthorizedRelayer.signMessage(
      JSON.stringify(message)
    );

    const request = {
      method: "POST",
      headers: {
        signature: signature,
      },
      body: { message: JSON.stringify(message) },
    } as TypedVercelRequest<RelayerFillLimit[]>;

    await handler(request, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });
});
