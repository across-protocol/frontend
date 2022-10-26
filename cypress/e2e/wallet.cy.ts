describe("wallet", () => {
  it("display ACX balance for connected wallet", () => {
    cy.visit("/bridge");
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("acx-balance").should("be.visible");
  });
});
