import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "../_types";
import { handleErrorCondition } from "../_errors";
import {
  buildSearchParams,
  getLogger,
  positiveIntStr,
  resolveVercelEndpoint,
} from "../_utils";
import { CANVAS } from "./image";
import { assert, Infer, type } from "superstruct";

const TwitterShareParamsSchema = type({
  s: positiveIntStr(),
  from: positiveIntStr(),
  to: positiveIntStr(),
});

type TwitterShareParams = Infer<typeof TwitterShareParamsSchema>;

export default async function handler(
  request: TypedVercelRequest<TwitterShareParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  logger.debug({
    at: "api/twitter-share",
    message: "Query data",
    query: request.query,
  });
  assert(request.query, TwitterShareParamsSchema);
  const { from, to, s } = request.query;

  try {
    const imageUrl = `${resolveVercelEndpoint()}/api/twitter-share/image?${buildSearchParams({ s, from, to })}`;
    const imageUrlWithBg = `${imageUrl}&background=true`; // use this for twitter card
    const pageUrl = `${resolveVercelEndpoint()}${request.url}`;

    const redirectLink = `${resolveVercelEndpoint()}/bridge?${buildSearchParams(
      {
        fromChain: from,
        toChain: to,
      }
    )}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@100;400&display=swap" rel="stylesheet">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Across Protocol - ${s}s Bridge Transfer</title>
            
            <!-- Open Graph meta tags -->
            <meta property="og:title" content="Across Protocol - ${s}s Bridge Transfer" />
            <meta property="og:description" content="I just bridged assets between chains in ${s} seconds using Across Protocol!" />
            <meta property="og:image" content="${imageUrlWithBg}" />
            <meta property="og:url" content="${pageUrl}" />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="Across Protocol" />
            <meta property="og:image:width" content="${CANVAS.width}">
            <meta property="og:image:height" content="${CANVAS.height}">
            
            <!-- Twitter Card meta tags -->
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Across Protocol - ${s}s Bridge Transfer" />
            <meta name="twitter:description" content="I just bridged assets between chains in ${s} seconds using Across Protocol!" />
            <meta name="twitter:image" content="${imageUrlWithBg}" />
            <meta name="twitter:image:alt" content="Bridge transfer achievement showing ${s} second completion time with Across Protocol branding" />
        </head>
        <body style="margin: 0; color: white; text-align: center; font-family: 'Barlow', sans-serif; font-weight: 400; font-style: normal;">
            <div style="width: 100vw; height: 100vh; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px;">
            <img src="${resolveVercelEndpoint()}/assets/twitter-bg.png" style="position: absolute; object-fit: cover; width: 100%; height: 100%; z-index: 0;"  />
              <img src="${imageUrl}" alt="Bridge Transfer Achievement" style="width: 100%; max-width:400px; height: auto; border-radius: 8px; z-index: 2;" />
              <a href="${redirectLink}" style="border: '1px gray solid'; color: white; text-decoration: none; z-index: 2; font-family: "Barlow", sans-serif; font-weight: 400; font-style: normal;">Try it</a>
            </div>
        </body>
      </html>`;
    response.setHeader(
      "Cache-Control",
      `public, max-age=${60 * 60 * 24 * 7}, immutable`
    ); // 1 week
    response.setHeader("Content-Type", "text/html");
    response.send(html);
  } catch (err) {
    console.error(err);
    handleErrorCondition("twitter-share", response, logger, err);
  }
}
