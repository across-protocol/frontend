describe("bridge", () => {
  beforeEach(() => {
    cy.intercept("/api/suggested-fees?*", { fixture: "suggested-fees" }).as(
      "getSuggestedFees"
    );
    cy.intercept("/api/coingecko?*", { fixture: "price" }).as(
      "getCoingeckoPrice"
    );
    cy.intercept("/api/limits?*", { fixture: "limits" }).as("getLimits");
  });

  afterEach(() => {
    cy.scrollTo("top");
  });

  it("render in initial state", () => {
    cy.visit("/bridge");
    cy.scrollTo("bottom");
    cy.dataCy("connect-wallet").should("be.visible");
  });

  it("display correct button after connect", () => {
    cy.scrollTo("bottom");
    cy.connectInjectedWallet("connect-wallet");
    cy.dataCy("bridge-button").should("be.visible");
    cy.dataCy("bridge-button").should("be.disabled");
  });
});
