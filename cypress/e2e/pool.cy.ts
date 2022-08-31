describe("pool", () => {
  it("render in initial state", () => {
    cy.visit("/pool");
    cy.dataCy("position-info-box").should("be.visible");
    cy.dataCy("pool-info-box").should("be.visible");
    cy.dataCy("add-liquidity-form").should("be.visible");
  });

  it("update info boxes on pool change", () => {
    cy.dataCy("select-pool").click();
    cy.dataCy("pool-weth").click();
    cy.wait(5000);

    cy.dataCy("position-info-box").should("be.visible");
    cy.dataCy("pool-info-box").should("be.visible");
    cy.dataCy("add-liquidity-form").should("be.visible");
  });

  it("enable input on connected wallet", () => {
    cy.connectInjectedWallet("add-liquidity-button");
    cy.wait(3000);
    cy.get("#amount").should("not.be.disabled");
  });
});
