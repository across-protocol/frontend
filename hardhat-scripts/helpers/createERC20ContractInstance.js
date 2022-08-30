/* eslint-disable */

const ethers = require("ethers");

// Use contracts-node because this script is being run in node.
const { getAbi, getAddress } = require("@uma/contracts-node");

const abi = getAbi("ERC20");

// Default to UMA Mainnet Contract Address.
module.exports = async function createERC20ContractInstance(signer, networkId) {
  const address = await getAddress("VotingToken", networkId);

  return new ethers.Contract(address, abi, signer);
};
