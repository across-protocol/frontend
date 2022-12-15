import { VercelRequest } from "@vercel/node";

export type TypedVercelRequest<QueryType, BodyType = any> = VercelRequest & {
  query: Partial<QueryType>;
  body: Partial<BodyType>;
};
