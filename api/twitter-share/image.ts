import { VercelResponse } from "@vercel/node";
import { createCanvas, loadImage } from "canvas";
import { TypedVercelRequest } from "../_types";
import { handleErrorCondition } from "../_errors";
import {
  boolStr,
  getLogger,
  intStringInRange,
  positiveIntStr,
} from "../_utils";
import path from "path";

import { assert, Infer, optional, type } from "superstruct";
import { getChainLogoPath } from "./_utils";
const assetsDir = path.join(__dirname, "assets");

const TwitterShareParamsSchema = type({
  s: intStringInRange(0, 5),
  from: positiveIntStr(),
  to: positiveIntStr(),
  background: optional(boolStr()),
});

type TwitterShareImageParams = Infer<typeof TwitterShareParamsSchema>;

// Twitter recommends 2:1 aspect ratio with minimum 300x157, maximum 4096x4096
// Must be under 5MB limit
// https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image
export const CANVAS = {
  width: 800,
  height: 400,
};

const chainLogoDimensions = 48; // px
const px = 20; // px 32
const py = 20; // px 24

export default async function handler(
  request: TypedVercelRequest<TwitterShareImageParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  try {
    logger.debug({
      at: "api/twitter-share/image",
      message: "Query data",
      query: request.query,
    });
    assert(request.query, TwitterShareParamsSchema);
    const { from, to, s, background } = request.query;
    const canvas = createCanvas(CANVAS.width, CANVAS.height);
    const ctx = canvas.getContext("2d");

    let baseImage;
    let backgroundImage;

    if (background === "true") {
      // Load both background and base image
      [backgroundImage, baseImage] = await Promise.all([
        loadImage(path.join(assetsDir, "twitter-bg.png")),
        loadImage(path.join(assetsDir, "base", `${s}.png`)),
      ]);
    } else {
      // Load only base image
      baseImage = await loadImage(path.join(assetsDir, "base", `${s}.png`));
    }

    // Get chain logo paths and load images only if they exist
    const originChainLogoPath = getChainLogoPath(Number(from));
    const destinationChainLogoPath = getChainLogoPath(Number(to));

    const [originChainLogo, destinationChainLogo] = await Promise.all([
      originChainLogoPath ? loadImage(originChainLogoPath) : null,
      destinationChainLogoPath ? loadImage(destinationChainLogoPath) : null,
    ]);

    // draw background if specified
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, CANVAS.width, CANVAS.height);

      // draw base layer with padding
      ctx.drawImage(
        baseImage,
        0 + px,
        0 + py,
        CANVAS.width - px * 2,
        CANVAS.height - py * 2
      );

      // Draw chain logos only if they exist (base layer contains fallback)
      if (originChainLogo) {
        ctx.drawImage(
          originChainLogo,
          263,
          92,
          chainLogoDimensions,
          chainLogoDimensions
        );
      }
      if (destinationChainLogo) {
        ctx.drawImage(
          destinationChainLogo,
          490,
          92,
          chainLogoDimensions,
          chainLogoDimensions
        );
      }
    } else {
      ctx.drawImage(baseImage, 0, 0, CANVAS.width, CANVAS.height);

      // Draw chain logos only if they exist (base layer contains fallback)
      if (originChainLogo) {
        ctx.drawImage(
          originChainLogo,
          257,
          82,
          chainLogoDimensions,
          chainLogoDimensions
        );
      }
      if (destinationChainLogo) {
        ctx.drawImage(
          destinationChainLogo,
          497,
          82,
          chainLogoDimensions,
          chainLogoDimensions
        );
      }
    }
    response.setHeader(
      "Cache-Control",
      `public, max-age=${60 * 60 * 24 * 7}, immutable`
    ); // 1 week
    response.setHeader("Content-Type", "image/png");

    const stream = canvas.createPNGStream();
    stream.pipe(response);
  } catch (err) {
    console.error(err);
    handleErrorCondition("twitter-share-image", response, logger, err);
  }
}
