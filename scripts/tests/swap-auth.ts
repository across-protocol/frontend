import { swap } from "./_swap-utils";

async function swapWithAuthorization() {
  console.log("Swapping with authorization...");
  await swap("auth");
}

swapWithAuthorization()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    if (e.response?.data) {
      console.log("Tx for debug sim:", e.response.data.transaction);
    }
  });
