import { swap } from "./_swap-utils";

async function swapWithAllowance() {
  console.log("Swapping with allowance...");
  await swap("approval");
}

swapWithAllowance()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    if (e.response?.data) {
      console.log("Tx for debug sim:", e.response.data.transaction);
    }
  });
