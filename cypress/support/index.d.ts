declare namespace Cypress {
  interface ApplicationWindow {
    ethereum: any;
  }

  interface VisitOptions {
    jsonRpcUrl?: string;
    chainId?: number;
    privateKey?: string;
  }

  interface Chainable {
    dataCy(value: string): Chainable<Element>;
    injectMockProvider(options: { chainId?: number; privateKey?: string });
    injectJsonRpcProvider(options: {
      jsonRpcUrl?: string;
      privateKey?: string;
    });
    connectInjectedWallet(connectWalletDataId: string);
  }
}
