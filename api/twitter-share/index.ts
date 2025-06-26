import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "../_types";
import { handleErrorCondition } from "../_errors";
import { getLogger, resolveVercelEndpoint } from "../_utils";
import { CANVAS } from "./image";

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
    // Construct the image URL (same params as this request)
    const imageUrl = `${resolveVercelEndpoint()}/api/twitter-share/image?seconds=${seconds}&originChainId=${originChainId}&destinationChainId=${destinationChainId}`;
    const pageUrl = `${resolveVercelEndpoint()}${request.url}`;

    // Generate HTML with meta tags
    // TODOs:
    // 1. consider adding a meta refresh-redirect to app.across.to after x seconds (for real users)
    // 2. we can even populate query params with the exact route
    // 3. style the page, consider using the background

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Across Protocol - ${seconds}s Bridge Transfer</title>
            
            <!-- Open Graph meta tags -->
            <meta property="og:title" content="Across Protocol - ${seconds}s Bridge Transfer" />
            <meta property="og:description" content="I just bridged assets between chains in ${seconds} seconds using Across Protocol!" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:url" content="${pageUrl}" />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="Across Protocol" />
            <meta property="og:image:width" content="${CANVAS.width}">
            <meta property="og:image:height" content="${CANVAS.height}">
            
            <!-- Twitter Card meta tags -->
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Across Protocol - ${seconds}s Bridge Transfer" />
            <meta name="twitter:description" content="I just bridged assets between chains in ${seconds} seconds using Across Protocol!" />
            <meta name="twitter:image" content="${imageUrl}" />
            <meta name="twitter:image:alt" content="Bridge transfer achievement showing ${seconds} second completion time with Across Protocol branding" />
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2e33 100%); color: white; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto;">
                <img src="${imageUrl}" alt="Bridge Transfer Achievement" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />
                <h1 style="margin: 0 0 10px 0; font-size: 24px;">${seconds}s Bridge Transfer</h1>
                <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9;">I just bridged assets between chains in ${seconds} seconds using Across Protocol!</p>
                <p style="margin: 0; font-size: 14px; opacity: 0.7;">Powered by <a href="https://across.to" style="color: #4CAF50; text-decoration: none;">Across Protocol</a></p>
            </div>
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
