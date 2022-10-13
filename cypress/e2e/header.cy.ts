describe("headers", () => {
  it("render in initial state", () => {
    cy.visit("/");
    cy.dataCy("primary-header").should("be.visible");
  });
  it("should not be transparent on any route except airdrop", () => {
    const routes = ["/", "/pool", "/rewards", "/transactions"];
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
  it("should be transparent on /airdrop", () => {
    cy.visit("/airdrop");
    cy.dataCy("primary-header").should(
      "have.css",
      "background-color",
      // #2d2e3300 in RGB is rgba(45, 46, 51, 0)
      "rgba(45, 46, 51, 0)"
    );
  });
});
