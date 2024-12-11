import { VercelRequest } from "@vercel/node";

export type TypedVercelRequest<T> = VercelRequest & {
  query: Partial<T>;
  body: T;
  headers: {
    signature: string;
  };
};
