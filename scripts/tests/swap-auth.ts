import { Wallet } from "ethers";

import { getProvider } from "../../api/_utils";
import { fetchSwapQuote, SWAP_API_BASE_URL } from "./_swap-utils";
import { buildAuthTxPayload } from "../../api/swap/auth/_utils";
import axios from "axios";

type AuthPayload = Awaited<ReturnType<typeof buildAuthTxPayload>>;

async function swapWithAuth() {
  console.log("Swapping with auth...");
  const swapQuote = await fetchSwapQuote<AuthPayload>("auth");

  if (!swapQuote) {
    console.log("No Quote");
    return;
  }

  if (process.env.DEV_WALLET_PK) {
    const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
      getProvider(swapQuote.swapTx.chainId)
    );

    // sign permit + deposit
    const permitSig = await wallet._signTypedData(
      swapQuote.eip712.transferWithAuthorization.domain,
      swapQuote.eip712.transferWithAuthorization.types,
      swapQuote.eip712.transferWithAuthorization.message
    );
    console.log("Signed permit:", permitSig);

    const depositSig = await wallet._signTypedData(
      swapQuote.eip712.deposit.domain,
      swapQuote.eip712.deposit.types,
      swapQuote.eip712.deposit.message
    );
    console.log("Signed deposit:", depositSig);

    // relay
    const relayResponse = await axios.post(`${SWAP_API_BASE_URL}/api/relay`, {
      ...swapQuote.swapTx,
      signatures: { permit: permitSig, deposit: depositSig },
    });
    console.log("Relay response:", relayResponse.data);

    // track relay
    while (true) {
      const relayStatusResponse = await axios.get(
        `${SWAP_API_BASE_URL}/api/relay/status?requestHash=${relayResponse.data.requestHash}`
      );
      console.log("Relay status response:", relayStatusResponse.data);

      if (relayStatusResponse.data.status === "success") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

swapWithAuth()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    if (e.response?.data) {
      console.log("Tx for debug sim:", e.response.data.transaction);
    }
  });
