import { VercelRequest } from "@vercel/node";

export type TypedVercelRequest<T> = VercelRequest & {
  body: T;
  headers: {
    signature: string;
  };
};
