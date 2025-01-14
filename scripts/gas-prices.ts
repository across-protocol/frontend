import { BigNumber } from "ethers";
import { writeFileSync } from "fs";
import { getCachedLimits, buildSearchParams } from "../api/_utils";
import assert from "assert";
import dotenv from "dotenv";

dotenv.config({
  path: [".env.local", ".env"],
});

type Limits = Awaited<ReturnType<typeof getCachedLimits>>;

type Route = {
  originChainId: number;
  originToken: string;
  destinationChainId: number;
  destinationToken: string;
  originTokenSymbol: string;
  destinationTokenSymbol: string;
};

// use this script to compare gas prices for relayers between 2 environments
async function compareGasPrices() {
  const PROD_URL = "https://app.across.to";
  const TEST_URL = process.env.TEST_URL_GAS_PRICE;

  assert(
    TEST_URL,
    'No Test URL defined. Please add "TEST_URL_GAS_PRICE" to .env file'
  );

  const routes = (await fetch(`${PROD_URL}/api/available-routes`).then((res) =>
    res.json()
  )) as Array<Route>;

  const chainTokenMap = (() => {
    const chainTokenMap = new Map<number, Set<string>>();
    routes.forEach((route) => {
      if (!chainTokenMap.has(route.destinationChainId)) {
        chainTokenMap.set(
          route.destinationChainId,
          new Set([route.destinationTokenSymbol])
        );
      } else {
        const tokens = chainTokenMap.get(route.destinationChainId)!;
        chainTokenMap.set(
          route.destinationChainId,
          tokens.add(route.destinationTokenSymbol)
        );
      }
    });
    return chainTokenMap;
  })();

  console.log("Batching requests by chainId => ", chainTokenMap);
  console.log("Please wait...");

  // gas prices are cached per-chain, so we want to batch requests by chainId for more accurate results
  const getLimitsByChainId = async (
    baseUrl: string,
    chainId: number,
    tokenBatch: string[]
  ) => {
    return Promise.all(
      tokenBatch.map(async (tokenSymbol) => {
        const route = routes.find(
          (r) =>
            r.destinationChainId === chainId &&
            r.destinationTokenSymbol === tokenSymbol
        );
        // shoudn't be possible
        if (!route) {
          throw new Error(
            `Route not found for chainId: ${chainId}, token: ${tokenSymbol}`
          );
        }

        const {
          originToken,
          destinationToken,
          originChainId,
          destinationChainId,
        } = route;

        const limits = (await fetch(
          `${baseUrl}/api/limits?${buildSearchParams({
            inputToken: originToken,
            outputToken: destinationToken,
            originChainId,
            destinationChainId,
          })}`
        ).then((res) => res.json())) as Limits;

        return {
          destinationChainId,
          gasFeeTotal: BigNumber.from(limits.relayerFeeDetails.gasFeeTotal),
          token: tokenSymbol,
        };
      })
    );
  };

  const fetchAllLimits = async (baseUrl: string) => {
    const allResults: Array<{
      token: string;
      destinationChainId: number;
      gasFeeTotal: BigNumber;
    }> = [];

    for (const [chainId, tokens] of chainTokenMap.entries()) {
      const tokenBatch = Array.from(tokens);
      const batchResults = await getLimitsByChainId(
        baseUrl,
        chainId,
        tokenBatch
      );
      allResults.push(...batchResults);
    }

    return allResults;
  };

  const [prodResults, testResults] = await Promise.all([
    fetchAllLimits(PROD_URL),
    fetchAllLimits(TEST_URL),
  ]);

  const aggregateResults = (
    results: Array<{
      token: string;
      destinationChainId: number;
      gasFeeTotal: BigNumber;
    }>
  ) => {
    const map = new Map<string, BigNumber>();

    results.forEach(({ token, destinationChainId, gasFeeTotal }) => {
      const key = `${token}-${destinationChainId}`;
      if (!map.has(key)) {
        // Use only the first entry for each token/chainId combination
        map.set(key, gasFeeTotal);
      }
      // Ignore subsequent duplicates
    });

    return map;
  };

  const prodResultsMap = aggregateResults(prodResults);
  const testResultsMap = aggregateResults(testResults);

  // Prepare a set of all unique keys from both production and test results
  const allKeys = new Set<string>([
    ...prodResultsMap.keys(),
    ...testResultsMap.keys(),
  ]);

  // Prepare comparison data without duplicates
  const comparisonData = Array.from(allKeys).map((key) => {
    const [token, destinationChainIdStr] = key.split("-");
    const destinationChainId = Number(destinationChainIdStr);
    const prodGasFee = prodResultsMap.get(key) || BigNumber.from(0);
    const testGasFee = testResultsMap.get(key) || BigNumber.from(0);
    const difference = testGasFee.sub(prodGasFee);
    const percentageChange = prodGasFee.isZero()
      ? "N/A"
      : `${difference.mul(100).div(prodGasFee).toNumber()}%`;

    return {
      Token: token,
      ChainID: destinationChainId,
      ProductionGasFee: prodGasFee.toString(),
      TestGasFee: testGasFee.toString(),
      Difference: difference.toString(),
      PercentageChange:
        percentageChange !== "N/A" ? `${percentageChange}` : "N/A",
    };
  });

  // Generate CSV content
  const generateCSV = (data: typeof comparisonData) => {
    const headers = [
      "Token",
      "ChainID",
      "ProductionGasFee",
      "TestGasFee",
      "Difference",
      "PercentageChange",
    ];
    const rows = data.map((row) =>
      [
        row.Token,
        row.ChainID,
        row.ProductionGasFee,
        row.TestGasFee,
        row.Difference,
        row.PercentageChange,
      ].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  };

  const csvContent = generateCSV(comparisonData);

  // Save the CSV content to a file
  writeFileSync("gas-price-comparison.csv", csvContent);

  console.log("CSV file has been saved to gas-price-comparison.csv");
}
compareGasPrices();
