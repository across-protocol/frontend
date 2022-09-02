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

    cy.dataCy("position-info-box").should("be.visible");
    cy.dataCy("pool-info-box").should("be.visible");
    cy.dataCy("add-liquidity-form").should("be.visible");
  });

  it("enable input on connected wallet", () => {
    cy.connectInjectedWallet("add-liquidity-button");
    cy.get("#amount").should("not.be.disabled");
  });

  it("adds liquidity", () => {
    cy.dataCy("select-pool").click();
    cy.dataCy("pool-eth").click();

    cy.get("#amount").should("not.be.disabled");
    cy.get("#amount").click().type("100");

    cy.dataCy("add-liquidity-button").click();
    cy.dataCy("bouncing-loader").should("be.visible");
    cy.wait(30000);
    // TX won't resolve to non-loading state because of dependency on NotifyJS.
    cy.visit("/pool");
    cy.connectInjectedWallet("wallet-connect-button");
    cy.dataCy("pool-position").contains("100");
  });

  it("removes liquidity", () => {
    cy.dataCy("remove-tab").click();
    cy.dataCy("remove-25").click();
    cy.dataCy("remove-amount-preview").contains("25 ETH");
    cy.dataCy("remove-50").click();
    cy.dataCy("remove-amount-preview").contains("50 ETH");
    cy.dataCy("remove-75").click();
    cy.dataCy("remove-amount-preview").contains("75 ETH");
    cy.dataCy("remove-max-button").click();
    cy.dataCy("remove-amount-preview").contains("100 ETH");
    cy.dataCy("remove-liquidity-button").click();
    cy.dataCy("bouncing-loader").should("be.visible");
    cy.wait(30000);
    // TX won't resolve to non-loading state because of dependency on NotifyJS.
    cy.visit("/pool");
    cy.connectInjectedWallet("wallet-connect-button");
    cy.dataCy("pool-position").contains("0");
  });
});
