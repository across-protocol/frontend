import { BalanceBatcher, BalanceBatcherFetchFn } from "../balances";

// mock multicall balance fetcher
const fakeGetBatchBalance: BalanceBatcherFetchFn = async (
  chainId,
  addresses,
  tokens,
  blockTag
) => {
  const balances: Record<string, Record<string, string>> = {};
  for (const addr of addresses) {
    balances[addr] = {};
    for (const token of tokens) {
      balances[addr][token] = `balance-${addr}-${token}`;
    }
  }
  return { blockNumber: blockTag ?? "latest", balances };
};

describe("BalanceBatcher", () => {
  let batcher: BalanceBatcher;
  let fetchSpy: jest.MockedFunction<BalanceBatcherFetchFn>;

  beforeEach(() => {
    fetchSpy = jest.fn(
      fakeGetBatchBalance
    ) as jest.MockedFunction<BalanceBatcherFetchFn>;

    batcher = new BalanceBatcher(fetchSpy);
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should batch multiple requests into one multicall", async () => {
    const chainId = 1;
    const tokenA = "ETH";
    const tokenB = "USDC";
    const address1 = "0xAddress1";
    const address2 = "0xAddress2";

    const promise1 = batcher.queueBalanceCall(
      chainId,
      tokenA,
      address1,
      "latest"
    );
    const promise2 = batcher.queueBalanceCall(
      chainId,
      tokenB,
      address1,
      "latest"
    );
    const promise3 = batcher.queueBalanceCall(
      chainId,
      tokenA,
      address2,
      "latest"
    );
    const promise4 = batcher.queueBalanceCall(
      chainId,
      tokenB,
      address2,
      "latest"
    );

    jest.advanceTimersByTime(batcher.batchInterval);

    const [res1, res2, res3, res4] = await Promise.all([
      promise1,
      promise2,
      promise3,
      promise4,
    ]);

    expect(res1).toBe(`balance-${address1}-${tokenA}`);
    expect(res2).toBe(`balance-${address1}-${tokenB}`);
    expect(res3).toBe(`balance-${address2}-${tokenA}`);
    expect(res4).toBe(`balance-${address2}-${tokenB}`);

    // Verify we're only making one RPC request
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      chainId,
      [address1, address2],
      [tokenA, tokenB],
      "latest"
    );
  });

  it("should reject all requests if multicall fails", async () => {
    // Force a failed RPC request
    const failingGetBatchBalance = async () => {
      throw new Error("Multicall failed");
    };
    batcher = new BalanceBatcher(failingGetBatchBalance);

    const chainId = 1;
    const token = "ETH";
    const address = "0xAddress1";

    const promise = batcher.queueBalanceCall(chainId, token, address, "latest");

    jest.advanceTimersByTime(batcher.batchInterval);

    await expect(promise).rejects.toThrow("Multicall failed");
  });
});
