import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: [".env.local", ".env"].map((file) => path.join(process.cwd(), file)),
});

export const getEnvs = () => {
  return process.env;
};

export function parseJsonSafe<T>(
  jsonString: string | undefined,
  fallback: T
): T {
  try {
    if (!jsonString) {
      return fallback;
    }
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return fallback;
  }
}
