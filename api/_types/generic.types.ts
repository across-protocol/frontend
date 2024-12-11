import { VercelRequest } from "@vercel/node";

export type TypedVercelRequest<Query, Body = any> = VercelRequest & {
  query: Partial<Query>;
  body: Partial<Body>;
};
