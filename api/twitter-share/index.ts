import { VercelResponse } from "@vercel/node";
import { createCanvas, loadImage } from "canvas";
import { TypedVercelRequest } from "../_types";
import { handleErrorCondition } from "../_errors";
import { getLogger, intStringInRange, positiveIntStr } from "../_utils";
import path from "path";

import { assert, Infer, type } from "superstruct";
import { getChainLogoPath } from "./_utils";
const assetsDir = path.join(__dirname, "assets");

const TwitterShareParamsSchema = type({
  fill_time: intStringInRange(0, 5),
  from_chain: positiveIntStr(),
  to_chain: positiveIntStr(),
});

export type TwitterShareImageParams = Infer<typeof TwitterShareParamsSchema>;

export const CANVAS = {
  width: 800,
  height: 800,
};

const chainLogoDimensions = {
  x: 89,
  y: 89,
};

export default async function handler(
  request: TypedVercelRequest<TwitterShareImageParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  try {
    logger.debug({
      at: "api/twitter-share",
      message: "Query data",
      query: request.query,
    });
    assert(request.query, TwitterShareParamsSchema);
    const { fill_time, from_chain, to_chain } = request.query;
    const canvas = createCanvas(CANVAS.width, CANVAS.height);
    const ctx = canvas.getContext("2d");

    const baseImage = await loadImage(
      path.join(assetsDir, "base", `${fill_time}.png`)
    );

    // Get chain logo paths and load images only if they exist
    const originChainLogoPath = getChainLogoPath(Number(from_chain));
    const destinationChainLogoPath = getChainLogoPath(Number(to_chain));

    const [originChainLogo, destinationChainLogo] = await Promise.all([
      originChainLogoPath ? loadImage(originChainLogoPath) : null,
      destinationChainLogoPath ? loadImage(destinationChainLogoPath) : null,
    ]);

    // draw base layer with padding
    ctx.drawImage(baseImage, 0, 0, CANVAS.width, CANVAS.height);

    // Draw chain logos only if they exist (base layer contains fallback)
    if (originChainLogo) {
      ctx.drawImage(
        originChainLogo,
        182,
        356,
        chainLogoDimensions.x,
        chainLogoDimensions.y
      );
    }
    if (destinationChainLogo) {
      ctx.drawImage(
        destinationChainLogo,
        529,
        356,
        chainLogoDimensions.x,
        chainLogoDimensions.y
      );
    }

    response.setHeader(
      "Cache-Control",
      `public, max-age=${60 * 60 * 24 * 30}, immutable`
    ); // 1 month
    response.setHeader("Content-Type", "image/png");

    const stream = canvas.createPNGStream();

    // Handle stream errors
    stream.on("error", (streamErr) => {
      logger.error({
        at: "api/twitter-share",
        message: "PNG stream error",
        error: streamErr,
      });
      if (!response.headersSent) {
        response.status(500).end();
      }
    });

    stream.pipe(response);
  } catch (err) {
    logger.error({
      at: "api/twitter-share",
      message: "Failed to generate Twitter share image",
      error: err,
    });

    // Only handle error if response hasn't been sent yet
    if (!response.headersSent) {
      handleErrorCondition("twitter-share-image", response, logger, err);
    }
  }
}
