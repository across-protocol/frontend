import { createClient } from "@vercel/edge-config";

export type Permission = "sponsored-gasless";

export type ApiKeyRecord = {
  name: string;
  enabled: boolean;
  permissions: Permission[];
  rateLimit?: number;
};

export type ApiKeysStore = Record<string, ApiKeyRecord>;

export type ValidateApiKeyResult = {
  valid: boolean;
  name?: string;
  permissions?: Permission[];
};

let edgeConfigClient: ReturnType<typeof createClient> | undefined;

function getEdgeConfigClient() {
  if (!edgeConfigClient) {
    const edgeConfigUrl = process.env.EDGE_CONFIG;
    if (!edgeConfigUrl) {
      return undefined;
    }
    edgeConfigClient = createClient(edgeConfigUrl);
  }
  return edgeConfigClient;
}

export async function validateApiKey(
  apiKey: string | undefined
): Promise<ValidateApiKeyResult> {
  // Bypass API key validation in local dev
  if (process.env.DISABLE_API_KEY_VALIDATION === "true") {
    return {
      valid: true,
      name: "local-dev",
      permissions: ["sponsored-gasless"],
    };
  }

  if (!apiKey) {
    return { valid: false };
  }

  const client = getEdgeConfigClient();
  if (!client) {
    return { valid: false };
  }

  const keys = await client.get<ApiKeysStore>("api-keys");
  const record = keys?.[apiKey];

  if (!record || !record.enabled) {
    return { valid: false };
  }

  return {
    valid: true,
    name: record.name,
    permissions: record.permissions,
  };
}
