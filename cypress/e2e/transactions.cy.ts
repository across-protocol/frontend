describe("transactions", () => {
  beforeEach(() => {
    cy.visit("/transactions");
  });

  it("render in initial state", () => {
    cy.dataCy("connect-wallet").should("be.visible");
  });
});
