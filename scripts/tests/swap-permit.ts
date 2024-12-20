import { swap } from "./_swap-utils";

async function swapWithPermit() {
  console.log("Swapping with permit...");
  await swap("permit");
}

swapWithPermit()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    if (e.response?.data) {
      console.log("Tx for debug sim:", e.response.data.transaction);
    }
  });
