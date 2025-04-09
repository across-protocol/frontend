import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: [".env.local", ".env"].map((file) => path.join(process.cwd(), file)),
});

export const getEnvs = () => {
  return process.env;
};
