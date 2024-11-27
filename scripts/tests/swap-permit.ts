import axios from "axios";
import dotenv from "dotenv";
import {
  filterTestCases,
  MIN_OUTPUT_CASES,
  EXACT_OUTPUT_CASES,
  SWAP_API_BASE_URL,
} from "./_swap-utils";
dotenv.config();

/**
 * Manual test script for the swap API. Should be converted to a proper test suite.
 */
async function swap() {
  const filterString = process.argv[2];
  const testCases = [...MIN_OUTPUT_CASES, ...EXACT_OUTPUT_CASES];
  const filteredTestCases = filterTestCases(testCases, filterString);
  for (const testCase of filteredTestCases) {
    console.log("\nTest case:", testCase.labels.join(" "));
    const response = await axios.get(`${SWAP_API_BASE_URL}/api/swap/permit`, {
      params: testCase.params,
    });
    console.log(response.data);
  }
}

swap()
  .then(() => console.log("Done"))
  .catch(console.error);
