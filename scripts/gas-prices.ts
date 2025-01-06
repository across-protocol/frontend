import { BigNumber } from "ethers";
import { writeFileSync } from "fs";

type Limits = {
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string;
  maxDepositShortDelay: string;
  recommendedDepositInstant: string;
  relayerFeeDetails: {
    relayFeeTotal: string;
    relayFeePercent: string;
    gasFeeTotal: string;
    gasFeePercent: string;
    capitalFeeTotal: string;
    capitalFeePercent: string;
  };
};

type Route = {
  originChainId: number;
  originToken: string;
  destinationChainId: number;
  destinationToken: string;
  originTokenSymbol: string;
  destinationTokenSymbol: string;
};

function buildSearchParams(
  params: Record<string, number | string | Array<number | string>>
): string {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((val) => searchParams.append(key, String(val)));
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

const BATCH_SIZE = 5;

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// use this script to compare gas prices for relayers between 2 environments
async function compareGasPrices() {
  const PROD_URL = "https://app.across.to";
  const TEST_URL = "https://app-frontend-v3-git-gas-markup-fee-uma.vercel.app";

  const routes = (await fetch(`${PROD_URL}/api/available-routes`).then((res) =>
    res.json()
  )) as Array<Route>;

  // Extract all unique destination tokens
  const uniqueDestinationTokens = Array.from(
    new Set(routes.map((route) => route.destinationTokenSymbol))
  );

  // Break the tokens into batches of 5
  const tokenBatches = chunkArray(uniqueDestinationTokens, BATCH_SIZE);

  const getLimits = async (baseUrl: string, tokenBatch: string[]) => {
    return Promise.all(
      routes
        .filter((route) => tokenBatch.includes(route.destinationTokenSymbol))
        .map(
          async ({
            destinationChainId,
            originToken,
            destinationToken,
            originChainId,
            destinationTokenSymbol,
          }) => {
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
              token: destinationTokenSymbol,
            };
          }
        )
    );
  };

  const fetchAllLimits = async (baseUrl: string) => {
    const allResults: Array<{
      token: string;
      destinationChainId: number;
      gasFeeTotal: BigNumber;
    }> = [];

    for (const batch of tokenBatches) {
      const batchResults = await getLimits(baseUrl, batch);
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
