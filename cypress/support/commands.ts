/// <reference types="cypress" />

import { InjectedEip1193Bridge } from "../utils/ethereum";
import createCustomizedBridge from "../utils/CustomizedBridge";

/**
 * Overwrite default `visit` command to inject web3 provider to `window.ethereum`.
 * Per default a mocked provider is injected. To inject a JSON RPC provider pass the
 * option `jsonRpcUrl`.
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
      // onBeforeLoad: (win) => {
      //   win.localStorage.clear();
      //   (win as any).ethereum = options?.jsonRpcUrl
      //     ? InjectedEip1193Bridge.withJsonRpcProvider(options)
      //     : InjectedEip1193Bridge.withMockProvider(options);
      // },
      onBeforeLoad(win: any) {
        options && options.onBeforeLoad && options.onBeforeLoad(win);
        win.localStorage.clear();

        win.ethereum = createCustomizedBridge();
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
Cypress.Commands.add(
  "injectMockProvider",
  (options: Partial<{ chainId: number; privateKey: string }>) => {
    cy.on("window:before:load", (win) => {
      win.localStorage.clear();
      (win as any).ethereum = InjectedEip1193Bridge.withMockProvider(options);
    });
  }
);

/**
 * Inject JSON RPC provider to `window.ethereum`.
 */
Cypress.Commands.add(
  "injectJsonRpcProvider",
  (options: Partial<{ jsonRpcUrl: string; privateKey: string }>) => {
    cy.on("window:before:load", (win) => {
      win.localStorage.clear();
      (win as any).ethereum =
        InjectedEip1193Bridge.withJsonRpcProvider(options);
    });
  }
);

/**
 * Connect detected wallet via bnc-onboard.
 */
Cypress.Commands.add("connectInjectedWallet", (connectWalletElementDataId) => {
  cy.dataCy(connectWalletElementDataId).click();
  cy.wait(1000);
  cy.get("onboard-v2")
    .shadow()
    .find(".wallets-container")
    .contains("Detected Wallet")
    .click();

  cy.get("onboard-v2")
    .shadow()
    .find(".button-container.absolute.svelte-ro440k")
    .click();
});
