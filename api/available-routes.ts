import { VercelResponse } from "@vercel/node";
import { object, Infer, optional, string } from "superstruct";
import dotenv from "dotenv";
import { validAddress, positiveIntStr } from "./_utils";
import { TypedVercelRequest } from "./_types";
import { getEnvs } from "./_env";

const {
  GIT_ENV_EXPORTED,
} = getEnvs();

const AvailableRoutesQueryParamsSchema = object({
  originToken: optional(validAddress()),
  destinationToken: optional(validAddress()),
  destinationChainId: optional(positiveIntStr()),
  originChainId: optional(positiveIntStr()),
  originTokenSymbol: optional(string()),
  destinationTokenSymbol: optional(string()),
});

let envPath = path.join(process.cwd(), "output_vercel_api.env");
let envFile = fs.readFileSync(envPath, "utf-8");
dotenv.populate(
  process.env as dotenv.DotenvPopulateInput,
  dotenv.parse(envFile)
);

type AvailableRoutesQueryParams = Infer<
  typeof AvailableRoutesQueryParamsSchema
>;

const handler = async (_: any, response: VercelResponse) => {
  response.status(200).json({
    test: GIT_ENV_EXPORTED,
  });
  return;
};

export default handler;
