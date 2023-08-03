describe("pool", () => {
  beforeEach(() => {
    cy.intercept("/api/suggested-fees?*", { fixture: "suggested-fees" }).as(
      "getSuggestedFees"
    );
    cy.intercept("/api/coingecko?*", { fixture: "price" }).as(
      "getCoingeckoPrice"
    );
    cy.intercept("/api/limits?*", { fixture: "limits" }).as("getLimits");
    cy.intercept("/api/pools?*", { fixture: "pools" }).as("getPools");

    cy.visit("/pool");
  });

  it("render in initial state", () => {
    cy.dataCy("user-pool-info-box").should("be.visible");
    cy.dataCy("pool-info-box").should("be.visible");
  });

  it("select pool", () => {
    cy.dataCy("select-pool").click();
    cy.dataCy("select-pool-modal").contains("ETH Pool").click();

    cy.dataCy("select-pool").should("contain.text", "WETH Pool");
  });

  it("show action button on connected wallet", () => {
    cy.scrollTo("bottom");
    cy.connectInjectedWallet("connect-wallet");
    cy.dataCy("add-button").should("be.visible");
  });
});
