import { Eip1193Bridge } from "@ethersproject/experimental/lib/eip1193-bridge";
import {
  BaseProvider,
  JsonRpcProvider,
  Network,
} from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";

export const DEFAULT_TEST_PK =
  Cypress.env("DEFAULT_TEST_PK") ||
  "0xde926db3012af759b4f24b5a51ef6afa397f04670f634aa4f48d4480417007f3";

export const DEFAULT_TEST_ADDRESS = new Wallet(DEFAULT_TEST_PK).address;
console.log("DEFAULT_TEST_ADDRESS", DEFAULT_TEST_ADDRESS);
/**
 * Customized EIP1193 bridge provider that gets injected to `window.ethereum` to cypress
 * tests. Can be used with a `MockProvider` or with a `JsonRpcProvider`.
 */
export class InjectedEip1193Bridge extends Eip1193Bridge {
  static withMockProvider(
    options: Partial<{
      chainId: number;
      privateKey: string;
    }>
  ) {
    return new InjectedEip1193Bridge(
      new Wallet(options?.privateKey || DEFAULT_TEST_PK),
      new MockProvider(options?.chainId || 1)
    );
  }

  static withJsonRpcProvider(
    options: Partial<{
      privateKey: string;
      jsonRpcUrl: string;
    }>
  ) {
    return new InjectedEip1193Bridge(
      new Wallet(options?.privateKey || DEFAULT_TEST_PK),
      new JsonRpcProvider(options.jsonRpcUrl)
    );
  }

  async sendAsync(
    request: { method: string; params?: Array<any> },
    callback?: (error: Error, payload: any) => any
  ) {
    try {
      const result = await this.send(request.method, request.params);
      callback(null, { result });
    } catch (error) {
      callback(error, null);
    }
  }

  async send(method: string, params: Array<any>): Promise<any> {
    const network = await this.provider.getNetwork();

    switch (method) {
      case "net_version":
        return network.chainId;
      default:
        break;
    }

    return super.send(method, params);
  }
}

export class MockProvider extends BaseProvider {
  async detectNetwork(): Promise<Network> {
    return this.network;
  }

  async perform(method: string, params: any) {
    switch (method) {
      case "call":
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
      case "getBalance":
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
      default:
        break;
    }

    return super.perform(method, params);
  }
}
