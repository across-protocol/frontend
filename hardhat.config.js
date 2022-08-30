require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      hardfork: "london",
      gasPrice: "auto",
      initialBaseFeePerGas: 1_000_000_000,
    },
  },
};
