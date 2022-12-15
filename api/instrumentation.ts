import { VercelResponse } from "@vercel/node";
import { ampli } from "../src/ampli";
import { AMPLITUDE_ENV, AMPLITUDE_KEY } from "./_constants";
import { InstrumentInputRequest } from "./_types";

const handler = async (
  request: InstrumentInputRequest,
  response: VercelResponse
) => {
  console.log(request.body.events[0].event_type);

  if (AMPLITUDE_KEY === undefined) {
    return response.status(500).send("Amplitude is not enabled");
  }
  ampli.load({
    environment: AMPLITUDE_ENV,
    client: {
      apiKey: AMPLITUDE_KEY,
    },
  });
  return request.query;
};

export default handler;
