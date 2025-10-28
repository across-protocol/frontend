import { ethers, utils } from "ethers";
import { recoverMessageAddress } from "viem";
import { hexToBytes } from "viem";

import { getEnvs } from "../../../../api/_env";
import {
  createOftSignature,
  SignedQuoteParams,
} from "../../../../api/_bridges/sponsorship";

// Mock the environment variables to ensure tests are deterministic.
jest.mock("../../../../api/_env", () => ({
  getEnvs: jest.fn(),
}));

// Create a random wallet for signing. This ensures that the tests are not dependent on a hardcoded private key.
const TEST_WALLET = ethers.Wallet.createRandom();
const TEST_PRIVATE_KEY = TEST_WALLET.privateKey;

// Helper function to generate a random 32-byte hex string, simulating a bytes32 address.
const randomAddress = () =>
  utils.hexZeroPad(ethers.Wallet.createRandom().address, 32);

describe("OFT Signature", () => {
  beforeEach(() => {
    // Before each test, mock the return value of getEnvs to provide our test private key.
    (getEnvs as jest.Mock).mockReturnValue({
      SPONSORSHIP_SIGNER_PRIVATE_KEY: TEST_PRIVATE_KEY,
    });
  });

  it("should create a valid signature for an OFT quote", async () => {
    // Prepare a sample OFT quote.
    const quote: SignedQuoteParams = {
      srcEid: 1,
      dstEid: 2,
      destinationHandler: randomAddress(),
      amountLD: "1000",
      nonce: utils.formatBytes32String("nonce"),
      deadline: Math.floor(Date.now() / 1000) + 3600,
      maxBpsToSponsor: 50,
      finalRecipient: randomAddress(),
      finalToken: randomAddress(),
      lzReceiveGasLimit: "200000",
      lzComposeGasLimit: "400000",
      executionMode: 0,
      actionData: "0x",
    };

    // Create the signature and get the hash that was signed.
    const { signature, hash } = await createOftSignature(quote);

    // Recover the address from the signature and the hash.
    // This simulates the on-chain validation by checking if the signature was created by the expected signer.
    // The OFT contract expects an EIP-191 compliant signature, so we use `recoverMessageAddress`.
    const recoveredAddress = await recoverMessageAddress({
      message: { raw: hexToBytes(hash as `0x${string}`) },
      signature: signature as `0x${string}`,
    });

    // Assert that the recovered address matches the address of our test wallet.
    expect(recoveredAddress).toEqual(TEST_WALLET.address);
  });
});
