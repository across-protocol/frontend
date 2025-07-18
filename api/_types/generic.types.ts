import { VercelRequest } from "@vercel/node";

export type TypedVercelRequest<TQuery, TBody = undefined> = Omit<
  VercelRequest,
  "body"
> & {
  query: Partial<TQuery>;
  body: TBody;
};
