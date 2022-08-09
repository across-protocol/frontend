describe("transactions", () => {
  beforeEach(() => {
    cy.visit("/transactions", { withInjectedMockProvider: true });
  });

  it("render in initial state", () => {
    cy.dataCy("connect-wallet").should("be.visible");
  });
});
