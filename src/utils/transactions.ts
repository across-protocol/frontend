import { Contract, ContractTransaction, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import {
  fixedPointAdjustment,
  gasMultiplierPerChain,
  hubPoolChainId,
} from "./constants";

/**
 * This function takes a raw transaction and a signer and returns the result of signing the transaction.
 * @param tx The raw transaction to sign.
 * @param signer A signer used to sign the transaction
 * @returns The raw transaction signed by the given `signer`.
 */
export function signTransaction(
  rawTx: ethers.providers.TransactionRequest,
  signer: ethers.Signer
): Promise<string> {
  //TODO: here is where we might do safety checks on the transaction
  return signer.signTransaction(rawTx);
}

export async function sendSignedTransaction(
  signedTx: string,
  provider: ethers.providers.Provider
): Promise<ethers.providers.TransactionResponse> {
  const tx = await provider.sendTransaction(signedTx);
  return tx;
}

type Transaction = Promise<ContractTransaction>;

export async function getPaddedGasEstimation(
  chainId: number,
  contract: Contract,
  method: string,
  ...args: any[]
) {
  const gasMultiplier = gasMultiplierPerChain[chainId];
  /* If the gas multiplier hasn't been set, run this function as a normal tx */
  if (!gasMultiplier) {
    return contract.estimateGas[method](...args);
  } else {
    // Estimate the gas with the provided estimateGas logic
    const gasEstimation = await contract.estimateGas[method](...args);
    // Factor in the padding
    const gasToRecommend = gasEstimation
      .mul(parseEther(String(gasMultiplier)))
      .div(fixedPointAdjustment);
    return gasToRecommend;
  }
}

/**
 * Pads the gas estimation by a fixed amount dictated in the `REACT_SEND_TXN_GAS_ESTIMATION_MULTIPLIER` env var
 * @param contract The contract that this transaction will originate from
 * @param method The specific call method
 * @returns A completed or failed transaction
 */
export function sendWithPaddedGas(
  contract: Contract,
  method: string,
  chainId: number = hubPoolChainId
) {
  /**
   * Executes a given smart contract method with padded gas.
   * @param args The arguments to supply this smart contract call
   * @returns A contract transaction result.
   */
  const fn = async (...args: any[]): Transaction => {
    const gasToRecommend = await getPaddedGasEstimation(
      chainId,
      contract,
      method,
      args
    );
    return contract[method](...args, {
      gasLimit: gasToRecommend,
    });
  };
  return fn;
}
