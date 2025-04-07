import * as fs from "fs";

import dotenv from "dotenv";
import assert from "assert";

dotenv.config({
  path: [".env.local", ".env"],
});

const fileName = "output_vercel.env";

async function main() {
  const GIT_ENV_REPO = process.env.GIT_ENV_REPO;
  const GIT_ENV_PROJECT = process.env.GIT_ENV_PROJECT;
  const GH_TOKEN = process.env.GH_TOKEN;

  try {
    assert(GIT_ENV_REPO, "GIT_ENV_REPO must be defined in env");
    assert(GIT_ENV_PROJECT, "GIT_ENV_PROJECT must be defined in env");
    assert(GH_TOKEN, "GH_TOKEN must be defined in env");

    const baseUrl = `${GIT_ENV_REPO}/${GIT_ENV_PROJECT}/outputs/`;
    const ghToken = GH_TOKEN;

    const response = await fetch(`${baseUrl}${fileName}`, {
      headers: {
        Authorization: `token ${ghToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download ${fileName}: ${response.statusText}`);
    }

    const content = await response.text();

    fs.writeFileSync(`./${fileName}`, content);
    fs.appendFileSync(".env", content);

    console.log("All files downloaded.");
  } catch (error) {
    console.error("Error downloading files:", error);
    process.exit(1);
  }
}

main();
