import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "../_types";
import { handleErrorCondition } from "../_errors";
import { getLogger, resolveVercelEndpoint } from "../_utils";

type TwitterShareParams = {
  seconds: number;
  originChainId: number;
  destinationChainId: number;
};

export default async function handler(
  request: TypedVercelRequest<TwitterShareParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  const { originChainId, destinationChainId, seconds } = request.query;

  try {
    console.log("request.url", request.url);
    // Construct the image URL (same params as this request)
    const imageUrl = `${resolveVercelEndpoint()}/api/twitter-share/image?seconds=${seconds}&originChainId=${originChainId}&destinationChainId=${destinationChainId}`;
    const pageUrl = `${resolveVercelEndpoint()}${request.url}`;

    console.log("imageUrl", imageUrl);

    // Generate HTML with meta tags
    // TODOs:
    // 1. consider adding a meta refresh-redirect to app.across.to after x seconds (for real users)
    // 2. we can even populate query params with the exact route
    // 3. style the page, consider using the background

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
            <title>Across Protocol - ${seconds}s Bridge Transfer</title>
            <meta property="og:title" content="Across Protocol - ${seconds}s Bridge Transfer" />
            <meta property="og:description" content="I just bridged assets between chains in ${seconds} seconds using Across Protocol!" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:url" content="${pageUrl}" />
            
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Across Protocol - ${seconds}s Bridge Transfer" />
            <meta name="twitter:description" content="I just bridged assets between chains in ${seconds} seconds using Across Protocol!" />
            <meta name="twitter:image" content="${imageUrl}" />
        </head>
        <body>
            <img src="${imageUrl}" alt="Bridge Transfer Achievement" />
            <p>I just bridged assets between chains in ${seconds} seconds using Across Protocol!</p>
        </body>
      </html>`;

    // Set cache headers (cache for 1 year)
    // response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.setHeader("Content-Type", "text/html");
    response.send(html);
  } catch (err) {
    console.error(err);
    handleErrorCondition("twitter-share", response, logger, err);
  }
}
