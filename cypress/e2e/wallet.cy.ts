describe("wallet", () => {
  it("display ACX balance for connected wallet", () => {
    cy.visit("/", { jsonRpcUrl: "http://localhost:8545" });
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("acx-balance").should("be.visible");
  });
});
