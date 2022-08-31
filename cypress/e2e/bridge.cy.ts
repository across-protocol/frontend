describe("bridge", () => {
  it("render in initial state", () => {
    cy.wait(5000);
    cy.visit("/");
    cy.dataCy("connect-wallet").should("be.visible");
    cy.dataCy("send").should("be.disabled");
  });

  it("display balance of 'from' asset ", () => {
    cy.connectInjectedWallet("connect-wallet");
    cy.wait(5000);
    cy.dataCy("balance").should("be.visible");
  });

  it("render fees box on input", () => {
    cy.wait(7000);
    cy.dataCy("bridge-amount-input").click().type("1");

    cy.dataCy("send").should("be.disabled");
    cy.dataCy("fees-box").should("be.visible");
  });

  it("Clicks send and submits a tx", () => {
    cy.wait(6000);
    cy.dataCy("send").click();
    cy.wait(5000);
    cy.dataCy("transaction-submitted").should("be.visible");
  });
});
