/**
 * Resolves the current vercel endpoint dynamically
 * @returns A valid URL of the current endpoint in vercel
 * @todo These are always going to be the same since we don't export REACT_APP currently.
 */
export const resolveWebsiteUrl = () => {
  const url = process.env.REACT_APP_VERCEL_URL ?? "across.to";
  const env = process.env.REACT_APP_VERCEL_ENV ?? "production";
  switch (env) {
    case "preview":
    case "production":
      return `https://${url}`;
    case "development":
    default:
      return `http://localhost:3000`;
  }
};
