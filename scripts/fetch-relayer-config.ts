import chalk from "chalk";
import { writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({
  path: [".env.local", ".env.production", ".env"],
});

const projectRoot = process.cwd();

const FILE = "exclusive-relayer-configs.json";
const FILE_PATH = `/src/data/${FILE}`;

const REMOTE =
  "https://raw.githubusercontent.com/across-protocol/exclusive-relayer-configs";

const commitHash = process.env.RELAYER_CONFIG_COMMIT_HASH ?? "master";

(async () => {
  try {
    const url = `${REMOTE}/${commitHash}/build/${FILE}`;
    console.log(chalk.cyan(`fetching file from ${commitHash}`));
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Unable to fetch file from ${REMOTE}`);
    }
    const data = await res.json();
    console.log(data);

    writeFileSync(projectRoot + FILE_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(chalk.bgRed("ERROR"));
    console.error(
      chalk.red(
        e instanceof Error ? e.message : "Error fetching relayer config file"
      )
    );
    process.exit(1);
  }
})();
