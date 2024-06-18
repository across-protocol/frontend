// https://github.com/microsoft/playwright/issues/23662

import { CHAIN_IDs } from "@across-protocol/constants";
import { writeFileSync } from "fs";
import path from "path";
import { format } from "prettier";

import routes from "../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";

async function generateTestRoutes(depositChainIdToTest?: number) {
  depositChainIdToTest ??= Number(
    process.env.E2E_DEPOSIT_CHAIN_ID_TO_TEST || CHAIN_IDs.OPTIMISM
  );

  const tokenAmountsMap = JSON.parse(
    process.env.E2E_TOKEN_AMOUNTS_TO_TEST || '{"USDC":10}'
  ) as Record<string, number>;

  // List of routes to test with origin chain as depositChainIdToTest
  const originRoutesToTest = routes.routes.filter(
    ({ fromChain, fromTokenSymbol }) =>
      fromChain === depositChainIdToTest && fromTokenSymbol in tokenAmountsMap
  );

  // Map of routes to test with destination chain as depositChainIdToTest
  const destinationRoutesToTest = routes.routes
    .filter(
      ({ toChain, fromTokenSymbol }) =>
        toChain === depositChainIdToTest && fromTokenSymbol in tokenAmountsMap
    )
    .reduce(
      (acc, route) => {
        if (!(route.fromChain in acc)) {
          acc[route.fromChain] = [];
        }
        acc[route.fromChain].push(route);
        return acc;
      },
      {} as Record<number, (typeof routes.routes)[0][]>
    );
  const destinationChainIdsToTest = Object.keys(destinationRoutesToTest);

  // Write the test routes to a file
  const testRoutesFileContent = `
  export const depositChainIdToTest = ${depositChainIdToTest};
  export const originRoutesToTest = ${JSON.stringify(
    originRoutesToTest,
    null,
    2
  )};
  export const destinationRoutesToTest = ${JSON.stringify(
    destinationRoutesToTest,
    null,
    2
  )};
  export const destinationChainIdsToTest = ${JSON.stringify(
    destinationChainIdsToTest,
    null,
    2
  )};
  export const tokenAmountsMap = ${JSON.stringify(tokenAmountsMap, null, 2)};
  `;
  const formattedTestRoutesFileContent = await format(testRoutesFileContent, {
    parser: "typescript",
  });
  writeFileSync(
    path.resolve(process.cwd(), "e2e/utils/deposit-test-routes.ts"),
    formattedTestRoutesFileContent
  );
}

generateTestRoutes(Number(process.argv[2]));
