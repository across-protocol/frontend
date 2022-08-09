import { MockProvider } from "@rsksmart/mock-web3-provider";

export type MockProviderOptions = {
  chainId?: number;
  address: string;
  privateKey: string;
};

export const DEFAULT_ACCOUNT = {
  address:
    Cypress.env("DEFAULT_ACCOUNT_ADDRESS") ||
    "0xB98bD7C7f656290071E52D1aA617D9cB4467Fd6D",
  privateKey:
    Cypress.env("DEFAULT_ACCOUNT_PK") ||
    "de926db3012af759b4f24b5a51ef6afa397f04670f634aa4f48d4480417007f3",
};

/**
 * Mocked web3 provider that is injected to `window.ethereum` for e2e tests. Note, that
 * this provider can NOT send transactions and should only be used for basic scenarios.
 */
export class MockWeb3Provider extends MockProvider {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(args: MockProviderOptions) {
    super({
      networkVersion: args.chainId,
      debug: false,
      ...args,
    });
  }

  static createDefault(overrides?: Partial<MockProviderOptions>) {
    return new MockWeb3Provider({
      address: DEFAULT_ACCOUNT.address,
      privateKey: DEFAULT_ACCOUNT.privateKey,
      chainId: overrides?.chainId || 1,
      ...overrides,
    });
  }

  async request({ method, params }: any): Promise<any> {
    if (method === "eth_getBalance") {
      return "0x0";
    }

    return super.request({ method, params });
  }
}
