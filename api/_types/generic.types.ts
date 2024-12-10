import { VercelRequest } from "@vercel/node";

export type TypedVercelRequest<Query, Body = undefined> = VercelRequest & {
  query: Partial<Query>;
  body: Partial<Body>;
};
