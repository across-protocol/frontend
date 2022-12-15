import { TypedVercelRequest } from "../generic.types";

export type InstrumentInputRequest = TypedVercelRequest<
  any,
  {
    events: {
      event_properties: Record<string, any>;
      event_type: string;
    }[];
  }
>;
