import { VercelResponse } from "@vercel/node";
import { object, Infer, optional, string } from "superstruct";
import dotenv from "dotenv";
import { validAddress, positiveIntStr } from "./_utils";
import { TypedVercelRequest } from "./_types";
import fs from "fs";
import path from "path";

const AvailableRoutesQueryParamsSchema = object({
  originToken: optional(validAddress()),
  destinationToken: optional(validAddress()),
  destinationChainId: optional(positiveIntStr()),
  originChainId: optional(positiveIntStr()),
  originTokenSymbol: optional(string()),
  destinationTokenSymbol: optional(string()),
});

dotenv.config({
  path: "./output_api.env",
});


let envPath = path.join(process.cwd(), 'output_api.env');
let envFile = fs.readFileSync(envPath, "utf-8");

type AvailableRoutesQueryParams = Infer<
  typeof AvailableRoutesQueryParamsSchema
>;

const handler = async (_: any, response: VercelResponse) => {
  if (envFile === "") {
    response.status(500).json({ error: "ERROR NO ENV FOUND" });
    return;
  }
  response.status(200).json({
    test: process.env.GIT_ENV_EXPORTED,
  });
  return;
};

export default handler;
