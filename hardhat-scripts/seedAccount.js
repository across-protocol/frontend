/* eslint-disable */

const hre = require("hardhat");
const ethers = hre.ethers;
const createERC20ContractInstance = require("./helpers/createERC20ContractInstance");
const hardhatAccountZero = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
// const hardhatAccountOne = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
// const hardhatAccountTwo = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";
const foundationAccount = "0x7a3a1c2de64f20eb5e916f40d11b01c441b2a8dc";

async function main() {
  try {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [foundationAccount],
    });

    const signer = await ethers.provider.getSigner(foundationAccount);

    const erc20 = await createERC20ContractInstance(signer, 1);
    await hre.network.provider.send("hardhat_setBalance", [
      foundationAccount,
      "0x10000000000000000000000",
    ]);

    await hre.network.provider.send("hardhat_setBalance", [
      hardhatAccountZero,
      "0x10000000000000000000000",
    ]);

    const txOne = await erc20.transfer(
      hardhatAccountZero,
      ethers.utils.parseEther("20")
    );

    console.log("TXOne", txOne);
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [foundationAccount],
    });
  } catch (err) {
    console.log("err", err);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
