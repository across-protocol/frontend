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
    const imageUrl = `${resolveVercelEndpoint()}/api/twitter-share/image?seconds=${seconds}&originChainId=${originChainId}&destinationChainId=${destinationChainId}`;
    const pageUrl = `${resolveVercelEndpoint()}${request.url}`;

    // TODOs:
    // 1. populate redirect query params with the exact route
    // 2. style the page

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
        <body style="margin: 0; color: white; text-align: center;">
            <div style="width: 100vw; height: 100vh; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px;">
            <img src="${resolveVercelEndpoint()}/assets/twitter-bg.png" style="position: absolute; object-fit: cover; width: 100%; height: 100%; z-index: 0;"  />
              <img src="${imageUrl}" alt="Bridge Transfer Achievement" style="width: 100%; max-width:400px; height: auto; border-radius: 8px; z-index: 2;" />
              <a href="${resolveVercelEndpoint()}/bridge" style="color: white; text-decoration: none; z-index: 2;">Try it</a>
            </div>
        </body>
      </html>`;
    // TODO: restore
    // response.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // 1 year
    response.setHeader("Content-Type", "text/html");
    response.send(html);
  } catch (err) {
    console.error(err);
    handleErrorCondition("twitter-share", response, logger, err);
  }
}
