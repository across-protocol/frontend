/**
 * This file is slimmed down version of the relayer-v2's ProviderUtils.ts:
 * https://github.com/across-protocol/relayer-v2/blob/f42aceafcadf16bc193ddd2b94fce2b504b9267f/src/utils/ProviderUtils.ts
 *
 * It is used to make many concurrent RPC requests to our provider more reliable.
 *
 * Until we create a separate package for this, we will keep this file in the api directory.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
import { QueueObject, queue } from "async";

// The async/queue library has a task-based interface for building a concurrent queue.
// This is the type we pass to define a request "task".
interface RateLimitTask {
  // These are the arguments to be passed to super.send().
  sendArgs: [string, Array<unknown>];

  // These are the promise callbacks that will cause the initial send call made by the user to either return a result
  // or fail.
  resolve: (result: any) => void;
  reject: (err: any) => void;
}

// StaticJsonRpcProvider is used in place of JsonRpcProvider to avoid redundant eth_chainId queries prior to each
// request. This is safe to use when the back-end provider is guaranteed not to change.
// See https://docs.ethers.io/v5/api/providers/jsonrpc-provider/#StaticJsonRpcProvider

// This provider is a very small addition to the StaticJsonRpcProvider that ensures that no more than `maxConcurrency`
// requests are ever in flight. It uses the async/queue library to manage this.
export class RateLimitedBatchProvider extends ethers.providers
  .JsonRpcBatchProvider {
  // The queue object that manages the tasks.
  private queue: QueueObject<any>;

  // Takes the same arguments as the JsonRpcProvider, but it has an additional maxConcurrency value at the beginning
  // of the list.
  constructor(
    maxConcurrency: number,
    ...cacheConstructorParams: ConstructorParameters<
      typeof ethers.providers.JsonRpcProvider
    >
  ) {
    super(...cacheConstructorParams);

    // This sets up the queue. Each task is executed by calling the superclass's send method, which fires off the
    // request. This queue sends out requests concurrently, but stops once the concurrency limit is reached. The
    // maxConcurrency is configured here.
    this.queue = queue(async ({ sendArgs, resolve, reject }: RateLimitTask) => {
      await super
        .send(...sendArgs)
        .then(resolve)
        .catch(reject);
    }, maxConcurrency);
  }

  override async send(method: string, params: Array<any>): Promise<any> {
    // This simply creates a promise and adds the arguments and resolve and reject handlers to the task.
    return new Promise<any>((resolve, reject) => {
      const task: RateLimitTask = {
        sendArgs: [method, params],
        resolve,
        reject,
      };
      this.queue.push(task);
    });
  }
}
