describe("referrals", () => {
  beforeEach(() => {
    cy.intercept("/api/suggested-fees?*", { fixture: "suggested-fees" }).as(
      "getSuggestedFees"
    );
    cy.intercept("/api/coingecko?*", { fixture: "price" }).as(
      "getCoingeckoPrice"
    );
    cy.intercept("/api/limits?*", { fixture: "limits" }).as("getLimits");

    cy.visit("/rewards/referrals");
  });

  it("render in initial state", () => {
    cy.dataCy("connect-wallet").should("be.visible");
  });

  it("display referral links and rewards on connected wallet", () => {
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("referral-links").should("be.visible");
    cy.dataCy("rewards-table").should("be.visible");
  });
});
