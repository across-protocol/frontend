describe("pool", () => {
  beforeEach(() => {
    cy.intercept("/api/suggested-fees?*", { fixture: "suggested-fees" }).as(
      "getSuggestedFees"
    );
    cy.intercept("/api/coingecko?*", { fixture: "price" }).as(
      "getCoingeckoPrice"
    );
    cy.intercept("/api/limits?*", { fixture: "limits" }).as("getLimits");
  });

  it("render in initial state", () => {
    cy.visit("/pool");
    cy.dataCy("position-info-box").should("be.visible");
    cy.dataCy("pool-info-box").should("be.visible");
  });

  it("update info boxes on pool change", () => {
    cy.dataCy("select-pool").click();
    cy.dataCy("pool-weth").click();

    cy.dataCy("position-info-box").should("be.visible");
    cy.dataCy("pool-info-box").should("be.visible");
  });

  it("show action button on connected wallet", () => {
    cy.connectInjectedWallet("connect-wallet");
    cy.dataCy("add-button").should("be.visible");
  });
});
