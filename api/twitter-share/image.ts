import { VercelResponse } from "@vercel/node";
import { createCanvas, loadImage } from "canvas";
import { TypedVercelRequest } from "../_types";
import { handleErrorCondition } from "../_errors";
import { getLogger } from "../_utils";
import path from "path";

type TwitterShareImageParams = {
  seconds: number;
  originChainId: number;
  destinationChainId: number;
};

export const CANVAS = {
  width: 580,
  height: 580,
};

export default async function handler(
  request: TypedVercelRequest<TwitterShareImageParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  const { originChainId, destinationChainId, seconds } = request.query;

  // Twitter recommends 2:1 aspect ratio with minimum 300x157, maximum 4096x4096
  // Using 1200x600 which is optimal for Twitter cards and under 5MB limit

  const canvas = createCanvas(CANVAS.width, CANVAS.height);
  const ctx = canvas.getContext("2d");

  try {
    const assetsDir = path.join(__dirname, "assets");
    // Temporarily only load the base image
    const baseImage = await loadImage(
      path.join(assetsDir, "base", `${seconds}.png`)
    );
    // TODO: draw chain icons
    // const [baseImage, origin, destination] = await Promise.all([
    //   loadImage(path.join(assetsDir, "base", `${seconds}.png`)),
    //   loadImage(path.join(assetsDir, "chain-logos", `${originChainId}.png`)),
    //   loadImage(path.join(assetsDir, "chain-logos", `${destinationChainId}.png`)),
    // ]);

    // draw base layer
    ctx.drawImage(baseImage, 0, 0, CANVAS.width, CANVAS.height);

    // draw chain logos
    // ctx.drawImage(origin, 80, 80, 120, 120);
    // ctx.drawImage(destination, canvasSize - 200, 80, 120, 120);

    // Set cache headers (cache for 1 year)
    // response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.setHeader("Content-Type", "image/png");

    const stream = canvas.createPNGStream();
    stream.pipe(response);
  } catch (err) {
    console.error(err);
    handleErrorCondition("twitter-share-image", response, logger, err);
  }
}
