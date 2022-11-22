describe("headers", () => {
  it("render in initial state", () => {
    cy.visit("/");
    cy.dataCy("primary-header").should("be.visible");
  });
  it("should not be transparent on any route except airdrop", () => {
    const routes = ["/bridge", "/pool", "/rewards", "/transactions"];
    for (const route of routes) {
      cy.visit(route);
      cy.dataCy("primary-header").should(
        "have.css",
        "background-color",
        // #2d2e33 in RGB is rgb(45, 46, 51)
        "rgb(45, 46, 51)"
      );
    }
  });
});
