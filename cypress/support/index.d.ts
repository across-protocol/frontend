declare namespace Cypress {
  interface ApplicationWindow {
    ethereum: any;
  }

  interface VisitOptions {
    withInjectedMockProvider?: boolean;
    chainId?: number;
    address?: string;
    privateKey?: string;
  }

  interface Chainable {
    dataCy(value: string): Chainable<Element>;
    injectMockProvider(options: {
      chainId?: number;
      address: string;
      privateKey: string;
    });
    connectInjectedWallet(connectWalletDataId: string);
  }
}
