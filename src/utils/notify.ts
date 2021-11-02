export function addEtherscan(transaction: any) {
  return {
    link: `https://etherscan.io/tx/${transaction.hash}`,
  };
}
