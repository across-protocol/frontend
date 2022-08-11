describe("wallet", () => {
  it("display ACX balance for connected wallet", () => {
    cy.visit("/");
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("acx-balance").should("be.visible");
  });

  it("display warning for unsupported network", () => {
    cy.visit("/", { chainId: 1234 });
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("unsupported-network").should("be.visible");
  });
});
