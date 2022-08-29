describe("transactions", () => {
  beforeEach(() => {
    cy.visit("/transactions", { jsonRpcUrl: "http://localhost:8545" });
  });

  it("render in initial state", () => {
    cy.dataCy("connect-wallet").should("be.visible");
  });
});
