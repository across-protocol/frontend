describe("wallet", () => {
  beforeEach(() => {
    cy.intercept("/api/suggested-fees?*", { fixture: "suggested-fees" }).as(
      "getSuggestedFees"
    );
    cy.intercept("/api/coingecko?*", { fixture: "price" }).as(
      "getCoingeckoPrice"
    );
    cy.intercept("/api/limits?*", { fixture: "limits" }).as("getLimits");
  });

  it("display ACX balance for connected wallet", () => {
    cy.visit("/bridge");
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("wallet-address").should("be.visible");
  });
});
