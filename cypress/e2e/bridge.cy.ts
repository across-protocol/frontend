describe("bridge", () => {
  it("render in initial state", () => {
    cy.wait(5000);
    cy.visit("/");
    cy.dataCy("connect-wallet").should("be.visible");
    cy.dataCy("send").should("be.disabled");
  });

  it("render fees box on input", () => {
    cy.dataCy("select-from-chain").click();
    cy.dataCy("from-chain-1").click();
    cy.dataCy("amount-input").type("1");

    cy.dataCy("send").should("be.disabled");
    cy.dataCy("fees-box").should("be.visible");
  });

  it("display balance of 'from' asset ", () => {
    cy.connectInjectedWallet("connect-wallet");

    cy.dataCy("balance").should("be.visible");
  });
});
