describe("pool", () => {
  beforeEach(() => {
    cy.visit("/pool", { withInjectedMockProvider: true });
  });

  it("render in initial state", () => {
    cy.dataCy("position-info-box").should("be.visible");
    cy.dataCy("pool-info-box").should("be.visible");
    cy.dataCy("add-liquidity-form").should("be.visible");
  });

  it("update info boxes on pool change", () => {
    cy.dataCy("select-pool").click();
    cy.dataCy("pool-weth").click();

    cy.dataCy("position-info-box").should("be.visible");
    cy.dataCy("pool-info-box").should("be.visible");
    cy.dataCy("add-liquidity-form").should("be.visible");
  });

  it("enable input on connected wallet", () => {
    cy.connectInjectedWallet("add-liquidity-button");

    cy.get("#amount").should("not.be.disabled");
  });
});
