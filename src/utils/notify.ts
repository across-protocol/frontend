import { ContractTransaction } from "ethers";
import { getProvider } from "utils";

/**
 * Calls and waits on the Notify API to resolve the status of a TX if the chain is supported by Onboard
 * @param tx The transaction to wait for
 * @param notify The BNC Notify API that is used to handle the UI visualization
 * @param ignoreErrors An optional parameter to ignore tx failure and return successful
 **/
export const waitOnTransaction = async (
  requiredChainId: number,
  tx: ContractTransaction,
  ignoreErrors?: boolean
): Promise<void> => {
  try {
    const provider = getProvider(requiredChainId);
    await provider.waitForTransaction(tx.hash);
  } catch (e) {
    if (!ignoreErrors) {
      throw e;
    }
  }
};
