import { TypedVercelRequest } from "./_types";
import { getEnvs } from "./_env";
import { Permission, validateApiKey } from "./_api-keys";

const { VERCEL_AUTOMATION_BYPASS_SECRET } = getEnvs();

export const Role = {
  // Requests with this role will be allowed to access opt-in chains
  OPT_IN_CHAINS: "opt-in-chains",
};

export function parseRole(req: TypedVercelRequest<unknown, unknown>) {
  const xVercelProtectionBypass =
    req.headers?.["x-vercel-protection-bypass"] ||
    req.query?.["x-vercel-protection-bypass"];
  if (
    xVercelProtectionBypass &&
    xVercelProtectionBypass === VERCEL_AUTOMATION_BYPASS_SECRET
  ) {
    return "opt-in-chains";
  }
}

export async function parseApiKeyPermissions(
  req: TypedVercelRequest<unknown, unknown>
): Promise<Permission[] | undefined> {
  const apiKey = req.headers?.["x-api-key"] as string | undefined;
  const { valid, permissions } = await validateApiKey(apiKey);
  return valid ? permissions : undefined;
}
