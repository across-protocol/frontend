describe("prelaunch", () => {
  const cardIds = [
    "bridge-traveler-card",
    "community-rewards-card",
    "liquidity-provider-card",
    "bridge-user-card",
  ];

  it("render in initial state", () => {
    cy.visit("/airdrop");
    cy.dataCy("connect-wallet").should("be.visible");
  });

  it("display airdrop details", () => {
    cy.dataCy("airdrop-details-button").click();
    cy.dataCy("airdrop-details").should("be.visible");

    cy.dataCy("back-button").click();
    cy.dataCy("airdrop-details-button").should("be.visible");
  });

  it("display all cards for disconnected wallet", () => {
    for (const cardId of cardIds) {
      cy.dataCy(cardId).scrollIntoView().should("be.visible");
    }
  });
});
