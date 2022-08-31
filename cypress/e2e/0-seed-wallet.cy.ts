/* IGNORE FOR NOW, UNSURE IF NEEDED */

// Fund 20 UMA to test account before running other tests.
describe("Fund UMA to test wallet", () => {
  it("Seeds tokens to accounts", () => {
    cy.exec(
      "HARDHAT_NETWORK=localhost node ./hardhat-scripts/seedAccount.js"
    ).then((res) => {
      // Should be no error.
      expect(res.stderr).to.eq("");
    });
  });
});
