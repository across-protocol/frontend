import path from "path";
import fs from "fs";
import dotenv from "dotenv";

let envPath = path.join(process.cwd(), ".env");

let envFile = fs.readFileSync(envPath, "utf-8");
dotenv.populate(
  process.env as dotenv.DotenvPopulateInput,
  dotenv.parse(envFile)
);

export const getEnvs = () => {
  return process.env;
};
