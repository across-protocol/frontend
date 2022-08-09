/// <reference types="cypress" />

import {
  MockWeb3Provider,
  MockProviderOptions,
  DEFAULT_ACCOUNT,
} from "../utils/ethereum";

/**
 * Overwrite default `visit` command to allow injecting web3 provider to
 * `window.ethereum`.
 */
Cypress.Commands.overwrite(
  "visit",
  (
    original,
    url: string | Partial<Cypress.VisitOptions>,
    options?: Partial<Cypress.VisitOptions>
  ) => {
    return original({
      ...options,
      url: url as string,
      onBeforeLoad: (win) => {
        if (options?.withInjectedMockProvider) {
          win.localStorage.clear();
          (win as any).ethereum = MockWeb3Provider.createDefault({
            chainId: options?.chainId || 1,
            privateKey: options?.privateKey || DEFAULT_ACCOUNT.privateKey,
            address: options?.address || DEFAULT_ACCOUNT.address,
          });
        }
      },
    });
  }
);

/**
 * Custom command to select DOM element by data-cy attribute.
 * @example cy.dataCy('greeting')
 */
Cypress.Commands.add("dataCy", (value) => {
  cy.get(`[data-cy=${value}]`);
});

/**
 * Inject mocked web3 provider to `window.ethereum`.
 */
Cypress.Commands.add("injectMockProvider", (options: MockProviderOptions) => {
  cy.on("window:before:load", (win) => {
    win.localStorage.clear();
    (win as any).ethereum = MockWeb3Provider.createDefault(options);
  });
});

/**
 * Connect detected wallet via bnc-onboard.
 */
Cypress.Commands.add("connectInjectedWallet", (connectWalletElementDataId) => {
  cy.dataCy(connectWalletElementDataId).click();
  cy.contains("Show More").click();
  cy.contains("Detected Wallet").click();
});
