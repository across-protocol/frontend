describe("bridge", () => {
  it("render in initial state", () => {
    cy.visit("/");
    cy.dataCy("connect-wallet").should("be.visible");
    cy.dataCy("send").should("be.disabled");
  });

  it("display balance of 'from' asset ", () => {
    cy.connectInjectedWallet("connect-wallet");
    cy.dataCy("balance").should("be.visible");
  });

  it("render fees box on input", () => {
    cy.wait(7000);
    cy.dataCy("bridge-amount-input").click().type("1");

    cy.dataCy("send").should("be.disabled");
    cy.dataCy("fees-box").should("be.visible");
  });

  it("Clicks send and submits a tx and shows the success page", () => {
    cy.dataCy("send").click();
    cy.dataCy("transaction-submitted").should("be.visible");
  });

  it("Closes the success page and goes back to main bridge", () => {
    cy.dataCy("bridge-success-button").click();
    cy.dataCy("bridge-amount-input").should("be.visible");
  });
});
