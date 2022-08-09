describe("wallet", () => {
  beforeEach(() => {
    cy.visit("/", { withInjectedMockProvider: true });
  });

  it("display ACX balance for connected wallet", () => {
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("acx-balance").should("be.visible");
  });

  it("display warning for unsupported network", () => {
    cy.visit("/", { withInjectedMockProvider: true, chainId: 1234 });
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("unsupported-network").should("be.visible");
  });
});
