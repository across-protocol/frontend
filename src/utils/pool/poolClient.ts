import assert from "assert";
import * as uma from "./uma";
import {
  bnZero,
  toBNWei,
  fixedPointAdjustment,
  calcPeriodicCompoundInterest,
  calcApr,
  BigNumber,
  BigNumberish,
  fromWei,
} from "../utils";
import { ethers, Signer } from "ethers";
import type { Overrides } from "@ethersproject/contracts";
import {
  TransactionRequest,
  TransactionReceipt,
  Log,
} from "@ethersproject/abstract-provider";
import { Provider, Block } from "@ethersproject/providers";
import set from "lodash/set";
import get from "lodash/get";
import has from "lodash/has";
import { calculateInstantaneousRate, RateModel } from "../lpFeeCalculator";
import { hubPool, acrossConfigStore } from "../contracts";
import {
  AcceleratingDistributor,
  AcceleratingDistributor__factory,
  MerkleDistributor,
  MerkleDistributor__factory,
  TypedEvent,
} from "../typechain";

const { erc20 } = uma.clients;
const { loop } = uma.utils;
const { TransactionManager } = uma.across;
const { SECONDS_PER_YEAR, DEFAULT_BLOCK_DELTA } = uma.across.constants;
const { AddressZero } = ethers.constants;

export type { Provider };

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export type Config = {
  chainId?: number;
  hubPoolAddress: string;
  acceleratingDistributorAddress: string;
  merkleDistributorAddress: string;
  wethAddress: string;
  configStoreAddress: string;
  confirmations?: number;
  blockDelta?: number;
  hasArchive?: boolean;
  hubPoolStartBlock?: number;
};
export type Dependencies = {
  provider: Provider;
};
export type StakeData = {
  cumulativeBalance: BigNumber;
  amountAirdropped: BigNumber;
};
export type Pool = {
  address: string;
  totalPoolSize: string;
  l1Token: string;
  lpToken: string;
  liquidReserves: string;
  exchangeRateCurrent: string;
  exchangeRatePrevious: string;
  estimatedApy: string;
  estimatedApr: string;
  blocksElapsed: number;
  secondsElapsed: number;
  utilizedReserves: string;
  projectedApr: string;
  liquidityUtilizationCurrent: string;
};
export type User = {
  address: string;
  poolAddress: string;
  lpTokens: string;
  positionValue: string;
  totalDeposited: string;
  feesEarned: string;
};
export type Transaction = {
  id: string;
  state: "requested" | "submitted" | "mined" | "error";
  toAddress: string;
  fromAddress: string;
  type: "Add Liquidity" | "Remove Liquidity";
  description: string;
  request?: TransactionRequest;
  hash?: string;
  receipt?: TransactionReceipt;
  error?: Error;
};
export type Token = {
  decimals: string;
  symbol: string;
  name: string;
};
export type State = {
  pools: Record<string, Pool>;
  users: Record<string, Record<string, User>>;
  transactions: Record<string, Transaction>;
  error?: Error;
};
export type EmitState = (
  path: string[],
  data: Pool | User | Transaction | Error
) => void;
export type PooledToken = {
  // LP token given to LPs of a specific L1 token.
  lpToken: string;
  // True if accepting new LP's.
  isEnabled: boolean;
  // Timestamp of last LP fee update.
  lastLpFeeUpdate: number;
  // Number of LP funds sent via pool rebalances to SpokePools and are expected to be sent
  // back later.
  utilizedReserves: BigNumber;
  // Number of LP funds held in contract less utilized reserves.
  liquidReserves: BigNumber;
  // Number of LP funds reserved to pay out to LPs as fees.
  undistributedLpFees: BigNumber;
};

class PoolState {
  constructor(
    private contract: hubPool.Instance,
    private address: string
  ) {}
  public async read(
    l1Token: string,
    latestBlock: number,
    previousBlock?: number
  ) {
    // typechain does not have complete types for call options, so we have to cast blockTag to any
    const exchangeRatePrevious = await this.exchangeRateAtBlock(
      l1Token,
      previousBlock || latestBlock - 1
    );

    const exchangeRateCurrent =
      await this.contract.callStatic.exchangeRateCurrent(l1Token);

    const pooledToken: PooledToken = await this.contract.pooledTokens(l1Token);
    const liquidityUtilizationCurrent: BigNumber =
      await this.contract.callStatic.liquidityUtilizationCurrent(l1Token);

    return {
      address: this.address,
      l1Token,
      latestBlock,
      previousBlock,
      exchangeRatePrevious,
      exchangeRateCurrent,
      liquidityUtilizationCurrent,
      ...pooledToken,
    };
  }
  public exchangeRateAtBlock(l1Token: string, blockTag: number) {
    return this.contract.callStatic.exchangeRateCurrent(l1Token, { blockTag });
  }
}

type EventIdParams = {
  blockNumber: number;
  transactionIndex: number;
  logIndex: number;
};
export class PoolEventState {
  private seen = new Set<string>();
  private iface: ethers.utils.Interface;
  // maintain ordered unique list of events so we can calculate state
  private events: uma.SerializableEvent[] = [];
  constructor(
    private contract: hubPool.Instance,
    private startBlock = 0
  ) {
    this.iface = new ethers.utils.Interface(hubPool.Factory.abi);
  }
  private makeId = (params: EventIdParams): string => {
    return uma.oracle.utils.eventKey(params);
  };
  hasEvent(params: EventIdParams): boolean {
    return this.seen.has(this.makeId(params));
  }
  private addEvent(params: EventIdParams): void {
    this.seen.add(this.makeId(params));
  }
  private filterSeen = (params: EventIdParams): boolean => {
    const seen = this.hasEvent(params);
    if (!seen) this.addEvent(params);
    return !seen;
  };
  private processEvent = (event: uma.SerializableEvent): void => {
    if (!this.filterSeen(event)) return;
    this.events = uma.oracle.utils.insertOrderedAscending(
      this.events,
      event,
      this.makeId
    );
  };
  private processEvents = (events: Array<uma.SerializableEvent>): void => {
    events.forEach(this.processEvent);
  };

  public async read(
    endBlock: number,
    l1TokenAddress?: string,
    userAddress?: string
  ): Promise<hubPool.EventState> {
    const events = await Promise.all([
      ...(await this.contract.queryFilter(
        this.contract.filters.LiquidityAdded(
          l1TokenAddress,
          undefined,
          undefined,
          userAddress
        ),
        this.startBlock,
        endBlock
      )),
      ...(await this.contract.queryFilter(
        this.contract.filters.LiquidityRemoved(
          l1TokenAddress,
          undefined,
          undefined,
          userAddress
        ),
        this.startBlock,
        endBlock
      )),
    ]);
    this.processEvents(events);
    return hubPool.getEventState(this.events);
  }
  makeEventFromLog = (log: Log): uma.SerializableEvent => {
    const description = this.iface.parseLog(log);
    return {
      ...log,
      ...description,
      event: description.name,
      eventSignature: description.signature,
    };
  };
  getL1TokenFromReceipt(receipt: TransactionReceipt): string {
    const events = receipt.logs
      .filter(
        (log) =>
          ethers.utils.getAddress(log.address) ===
          ethers.utils.getAddress(this.contract.address)
      )
      .map(this.makeEventFromLog);

    // save these events
    this.processEvents(events);
    // only process token receipt events, because we just want the l1 token involved with this transfer
    const eventState = hubPool.getEventState(events);
    // event state is keyed by l1token address
    const l1Tokens = Object.keys(eventState);
    assert(l1Tokens.length, "Token not found from events");
    assert(l1Tokens.length === 1, "Multiple tokens found from events");
    return l1Tokens[0];
  }
  readTxReceipt(receipt: TransactionReceipt): hubPool.EventState {
    const events = receipt.logs
      .filter(
        (log) =>
          ethers.utils.getAddress(log.address) ===
          ethers.utils.getAddress(this.contract.address)
      )
      .map(this.makeEventFromLog);
    this.processEvents(events);
    return hubPool.getEventState(this.events);
  }
}

class UserState {
  private seen = new Set<string>();
  private events: uma.clients.erc20.Transfer[] = [];
  constructor(
    private contract: uma.clients.erc20.Instance,
    private userAddress: string,
    private startBlock = 0,
    private acceleratingDistributorContractAddress = ""
  ) {}
  private makeId(params: EventIdParams): string {
    return uma.oracle.utils.eventKey(params);
  }
  hasEvent(params: EventIdParams): boolean {
    return this.seen.has(this.makeId(params));
  }
  private addEvent(params: EventIdParams): void {
    this.seen.add(this.makeId(params));
  }
  private filterSeen = (params: EventIdParams): boolean => {
    const seen = this.hasEvent(params);
    if (!seen) this.addEvent(params);
    return !seen;
  };
  /**
   * readEvents. Fetch and cache events for the user.
   *
   * @param {number} endBlock
   */
  public async readEvents(
    endBlock: number
  ): Promise<uma.clients.erc20.Transfer[]> {
    if (endBlock <= this.startBlock) return [];
    const { userAddress } = this;
    const events: TypedEvent<
      [string, string, BigNumber] & {
        from: string;
        to: string;
        value: BigNumber;
      }
    >[] = (
      await Promise.all([
        ...(await this.contract.queryFilter(
          this.contract.filters.Transfer(userAddress, undefined),
          this.startBlock,
          endBlock
        )),
        ...(await this.contract.queryFilter(
          this.contract.filters.Transfer(undefined, userAddress),
          this.startBlock,
          endBlock
        )),
      ])
    )
      // filter out events we have seen
      .filter(this.filterSeen)
      // filter out mint/burn transfers
      .filter(
        (event: uma.clients.erc20.Transfer) =>
          // ignore mint events
          event.args.from !== AddressZero &&
          // ignore burn events
          event.args.to !== AddressZero &&
          // ignore AD transfer events in
          event.args.to !== this.acceleratingDistributorContractAddress &&
          // ignore AD transfer events out
          event.args.from !== this.acceleratingDistributorContractAddress &&
          // ignore self transfer events
          event.args.from !== event.args.to
      )
      .flat();

    this.events = this.events.concat(events).sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
      if (a.transactionIndex !== b.transactionIndex)
        return a.transactionIndex - b.transactionIndex;
      if (a.logIndex !== b.logIndex) return a.logIndex - b.logIndex;
      throw new Error("Duplicate events at tx hash: " + a.transactionHash);
    });
    // ethers queries are inclusive [start,end] unless start === end, then exclusive (start,end). we increment to make sure we dont see same event twice
    this.startBlock = endBlock + 1;
    return this.events;
  }
  /**
   * read. Reads the state for the user, building state from events as well as contract calls.
   *
   * @param {number} endBlock
   */
  public async read(endBlock: number) {
    const { userAddress } = this;
    const transferEvents = await this.readEvents(endBlock);
    const state = uma.clients.erc20.getEventState(transferEvents);
    const balanceTransferred = state?.balances?.[userAddress] || "0";
    return {
      transferEvents,
      balanceTransferred,
      address: userAddress,
      balanceOf: await this.contract.balanceOf(userAddress),
    };
  }
}

export function calculateRemoval(amountWei: BigNumber, percentWei: BigNumber) {
  const receive = amountWei.mul(percentWei).div(fixedPointAdjustment);
  const remain = amountWei.sub(receive);
  return {
    receive: receive.toString(),
    remain: remain.toString(),
  };
}
// params here mimic the user object type
export function previewRemoval(
  values: {
    positionValue: BigNumberish;
    feesEarned: BigNumberish;
    totalDeposited: BigNumberish;
  },
  percentFloat: number
) {
  const percentWei = toBNWei(percentFloat);
  return {
    position: {
      ...calculateRemoval(BigNumber.from(values.totalDeposited), percentWei),
    },
    fees: {
      ...calculateRemoval(BigNumber.from(values.feesEarned), percentWei),
    },
    total: {
      ...calculateRemoval(BigNumber.from(values.positionValue), percentWei),
    },
  };
}
function joinUserState(
  poolState: Pool,
  tokenEventState: hubPool.TokenEventState,
  userState: Awaited<ReturnType<UserState["read"]>>,
  transferValue = bnZero,
  cumulativeStakeBalance = bnZero,
  cumulativeStakeClaimBalance = bnZero
): User {
  const positionValue = BigNumber.from(poolState.exchangeRateCurrent)
    .mul(userState.balanceOf.add(cumulativeStakeBalance))
    .div(fixedPointAdjustment);
  const totalDeposited = BigNumber.from(
    tokenEventState?.tokenBalances[userState.address] || "0"
  ).add(cumulativeStakeClaimBalance);
  const feesEarned = positionValue.sub(totalDeposited.add(transferValue));
  return {
    address: userState.address,
    poolAddress: poolState.address,
    lpTokens: userState.balanceOf.toString(),
    positionValue: positionValue.toString(),
    totalDeposited: totalDeposited.toString(),
    feesEarned: feesEarned.toString(),
  };
}
function joinPoolState(
  poolState: Awaited<ReturnType<PoolState["read"]>>,
  latestBlock: Block,
  previousBlock: Block,
  rateModel?: RateModel
): Pool {
  const totalPoolSize = poolState.liquidReserves.add(
    poolState.utilizedReserves
  );
  const secondsElapsed = latestBlock.timestamp - previousBlock.timestamp;
  const blocksElapsed = latestBlock.number - previousBlock.number;
  const exchangeRatePrevious = poolState.exchangeRatePrevious.toString();
  const exchangeRateCurrent = poolState.exchangeRateCurrent.toString();
  const liquidityUtilizationCurrent =
    poolState.liquidityUtilizationCurrent.toString();

  const estimatedApy = calcPeriodicCompoundInterest(
    exchangeRatePrevious,
    exchangeRateCurrent,
    secondsElapsed,
    SECONDS_PER_YEAR
  );
  const estimatedApr = calcApr(
    exchangeRatePrevious,
    exchangeRateCurrent,
    secondsElapsed,
    SECONDS_PER_YEAR
  );
  let projectedApr = "";

  if (rateModel) {
    projectedApr = fromWei(
      calculateInstantaneousRate(rateModel, liquidityUtilizationCurrent)
        .mul(liquidityUtilizationCurrent)
        .div(fixedPointAdjustment)
    );
  }

  return {
    address: poolState.address,
    totalPoolSize: totalPoolSize.toString(),
    l1Token: poolState.l1Token,
    lpToken: poolState.lpToken,
    liquidReserves: poolState.liquidReserves.toString(),
    exchangeRateCurrent: poolState.exchangeRateCurrent.toString(),
    exchangeRatePrevious: poolState.exchangeRatePrevious.toString(),
    estimatedApy,
    estimatedApr,
    blocksElapsed,
    secondsElapsed,
    projectedApr,
    utilizedReserves: poolState.utilizedReserves.toString(),
    liquidityUtilizationCurrent,
  };
}
export class ReadPoolClient {
  private poolState: PoolState;
  private contract: hubPool.Instance;
  constructor(
    private address: string,
    private provider: Provider
  ) {
    this.contract = hubPool.connect(address, this.provider);
    this.poolState = new PoolState(this.contract, this.address);
  }
  public read(tokenAddress: string, latestBlock: number) {
    return this.poolState.read(tokenAddress, latestBlock);
  }
}
export function validateWithdraw(
  pool: Pool,
  user: User,
  lpTokenAmount: BigNumberish
) {
  const l1TokensToReturn = BigNumber.from(lpTokenAmount)
    .mul(pool.exchangeRateCurrent)
    .div(fixedPointAdjustment);
  assert(
    BigNumber.from(l1TokensToReturn).gt("0"),
    "Must withdraw amount greater than 0"
  );
  assert(
    BigNumber.from(lpTokenAmount).lte(user.lpTokens),
    "You cannot withdraw more than you have"
  );
  return { lpTokenAmount, l1TokensToReturn: l1TokensToReturn.toString() };
}

export class Client {
  private transactionManagers: Record<
    string,
    ReturnType<typeof TransactionManager>
  > = {};
  private hubPool: hubPool.Instance;
  private acceleratingDistributor: AcceleratingDistributor;
  private merkleDistributor: MerkleDistributor;
  public readonly state: State = { pools: {}, users: {}, transactions: {} };
  private poolEvents: PoolEventState;
  private erc20s: Record<string, uma.clients.erc20.Instance> = {};
  private intervalStarted = false;
  private configStoreClient: acrossConfigStore.Client;
  private exchangeRateTable: Record<string, Record<number, BigNumberish>> = {};
  private userServices: Record<string, Record<string, UserState>> = {};
  constructor(
    public readonly config: Config,
    public readonly deps: Dependencies,
    private emit: EmitState
  ) {
    config.chainId = config.chainId || 1;
    this.hubPool = this.createHubPoolContract(deps.provider);
    this.acceleratingDistributor = this.createAcceleratingDistributorContract(
      deps.provider
    );
    this.merkleDistributor = this.createMerkleDistributorContract(
      deps.provider
    );
    this.poolEvents = new PoolEventState(
      this.hubPool,
      this.config.hubPoolStartBlock
    );
    this.configStoreClient = new acrossConfigStore.Client(
      config.configStoreAddress,
      deps.provider
    );
  }
  public getOrCreateErc20Contract(address: string): uma.clients.erc20.Instance {
    if (this.erc20s[address]) return this.erc20s[address];
    this.erc20s[address] = erc20.connect(address, this.deps.provider);
    return this.erc20s[address];
  }
  public getOrCreatePoolContract(): hubPool.Instance {
    return this.hubPool;
  }
  public createHubPoolContract(
    signerOrProvider: Signer | Provider
  ): hubPool.Instance {
    return hubPool.connect(this.config.hubPoolAddress, signerOrProvider);
  }
  private getOrCreatePoolEvents() {
    return this.poolEvents;
  }
  public createAcceleratingDistributorContract(
    signerOrProvider: Signer | Provider
  ): AcceleratingDistributor {
    return AcceleratingDistributor__factory.connect(
      this.config.acceleratingDistributorAddress,
      signerOrProvider
    );
  }
  public createMerkleDistributorContract(
    signerOrProvider: Signer | Provider
  ): MerkleDistributor {
    return MerkleDistributor__factory.connect(
      this.config.merkleDistributorAddress,
      signerOrProvider
    );
  }
  public getOrCreateAcceleratingDistributorContract(): AcceleratingDistributor {
    return this.acceleratingDistributor;
  }
  public getOrCreateMerkleDistributorContract(): MerkleDistributor {
    return this.merkleDistributor;
  }
  private getOrCreateUserService(userAddress: string, tokenAddress: string) {
    if (has(this.userServices, [tokenAddress, userAddress]))
      return get(this.userServices, [tokenAddress, userAddress]);
    const erc20Contract = this.getOrCreateErc20Contract(tokenAddress);
    const userService = new UserState(erc20Contract, userAddress);
    // this service is stateful now, so needs to be cached
    set(this.userServices, [tokenAddress, userAddress], userService);
    return userService;
  }
  private updateExchangeRateTable(
    l1TokenAddress: string,
    exchangeRateTable: Record<number, BigNumberish>
  ): Record<number, BigNumberish> {
    if (!this.exchangeRateTable[l1TokenAddress])
      this.exchangeRateTable[l1TokenAddress] = {};
    this.exchangeRateTable[l1TokenAddress] = {
      ...this.exchangeRateTable[l1TokenAddress],
      ...exchangeRateTable,
    };
    return this.exchangeRateTable[l1TokenAddress];
  }
  async resolveStakingData(
    lpToken: string,
    l1TokenAddress: string,
    userState: Awaited<ReturnType<UserState["read"]>>
  ): Promise<StakeData> {
    assert(
      this.config.acceleratingDistributorAddress,
      "Must have the accelerating distributor address"
    );
    assert(
      this.config.merkleDistributorAddress,
      "Must have the merkle distributor address"
    );

    // Define the contracts we need to interact with.
    const acceleratingDistributorContract =
      this.getOrCreateAcceleratingDistributorContract();
    const merkleDistributorContract =
      this.getOrCreateMerkleDistributorContract();
    const poolContract = this.getOrCreatePoolContract();

    // Get the list of all claims made by the user.
    const claimList = await merkleDistributorContract.queryFilter(
      merkleDistributorContract.filters.Claimed(
        undefined,
        undefined,
        userState.address,
        undefined,
        undefined,
        lpToken
      )
    );

    // Calculate the total amount of LP tokens claimed by the user from the merkle
    // distributor contract with the exchange rate at the time of the claim.
    const amountOfLPClaimed = (
      await Promise.all(
        claimList.map(async (claim) =>
          claim.args.amount.mul(
            await poolContract.callStatic.exchangeRateCurrent(l1TokenAddress, {
              blockTag: claim.blockNumber,
            })
          )
        )
      )
    ).reduce((prev, acc) => acc.add(prev), bnZero);

    // Get the cumulative balance of the user from the accelerating distributor contract.
    const { cumulativeBalance } =
      await acceleratingDistributorContract.getUserStake(
        lpToken,
        userState.address
      );

    return {
      cumulativeBalance,
      amountAirdropped: amountOfLPClaimed,
    };
  }

  // calculates the value of each LP token transfer at the block it was sent. this only works if we have archive node
  async calculateLpTransferValue(
    l1TokenAddress: string,
    userState: Awaited<ReturnType<UserState["read"]>>
  ) {
    assert(
      this.config.hasArchive,
      "Can only calculate historical lp values with archive node"
    );
    const contract = this.getOrCreatePoolContract();
    const pool = new PoolState(contract, this.config.hubPoolAddress);
    const blockNumbers = userState.transferEvents
      .map((x) => x.blockNumber)
      // we are going to lookup exchange rates for block numbers only if we dont already have it
      // its possible these values do not exist, so to prevent crashing do optional chaining
      .filter(
        (blockNumber) =>
          !this.exchangeRateTable?.[l1TokenAddress]?.[blockNumber]
      );

    // new exchange rate lookups
    const exchangeRateTable = this.updateExchangeRateTable(
      l1TokenAddress,
      Object.fromEntries(
        await Promise.all(
          blockNumbers.map(async (blockNumber) => {
            return [
              blockNumber,
              await pool.exchangeRateAtBlock(l1TokenAddress, blockNumber),
            ];
          })
        )
      )
    );

    return userState.transferEvents.reduce((result, transfer) => {
      const exchangeRate = exchangeRateTable[transfer.blockNumber];
      if (transfer.args.to === userState.address) {
        return result.add(
          transfer.args.value.mul(exchangeRate).div(fixedPointAdjustment)
        );
      }
      if (transfer.args.from === userState.address) {
        return result.sub(
          transfer.args.value.mul(exchangeRate).div(fixedPointAdjustment)
        );
      }
      // we make sure to filter out any transfers where to/from is the same user
      return result;
    }, bnZero);
  }
  private getOrCreateTransactionManager(signer: Signer, address: string) {
    if (this.transactionManagers[address])
      return this.transactionManagers[address];
    const txman = TransactionManager(
      { confirmations: this.config.confirmations },
      signer,
      (event, id, data) => {
        if (event === "submitted") {
          this.state.transactions[id].state = event;
          this.state.transactions[id].hash = data as string;
          this.emit(["transactions", id], { ...this.state.transactions[id] });
        }
        if (event === "mined") {
          const txReceipt = data as TransactionReceipt;
          this.state.transactions[id].state = event;
          this.state.transactions[id].receipt = txReceipt;
          this.emit(["transactions", id], { ...this.state.transactions[id] });
          // trigger pool and user update for a known mined transaction
          const tx = this.state.transactions[id];
          this.updateUserWithTransaction(tx.fromAddress, txReceipt).catch(
            (err) => {
              this.emit(["error"], err);
            }
          );
        }
        if (event === "error") {
          this.state.transactions[id].state = event;
          this.state.transactions[id].error = data as Error;
          this.emit(["transactions", id], { ...this.state.transactions[id] });
        }
      }
    );
    this.transactionManagers[address] = txman;
    return txman;
  }
  async addEthLiquidity(
    signer: Signer,
    l1TokenAmount: BigNumberish,
    overrides: Overrides = {}
  ) {
    const { hubPoolAddress, wethAddress: l1Token } = this.config;
    const userAddress = await signer.getAddress();
    const contract = this.getOrCreatePoolContract();
    const txman = this.getOrCreateTransactionManager(signer, userAddress);

    // dont allow override value here
    const request = await contract.populateTransaction.addLiquidity(
      l1Token,
      l1TokenAmount,
      {
        ...overrides,
        value: l1TokenAmount,
      }
    );
    const id = txman.request(request);

    this.state.transactions[id] = {
      id,
      state: "requested",
      toAddress: hubPoolAddress,
      fromAddress: userAddress,
      type: "Add Liquidity",
      description: "Adding ETH to pool",
      request,
    };
    this.emit(["transactions", id], { ...this.state.transactions[id] });
    await txman.update();
    return id;
  }
  async addTokenLiquidity(
    signer: Signer,
    l1Token: string,
    l1TokenAmount: BigNumberish,
    overrides: Overrides = {}
  ) {
    const { hubPoolAddress } = this.config;
    const userAddress = await signer.getAddress();
    const contract = this.getOrCreatePoolContract();
    const txman = this.getOrCreateTransactionManager(signer, userAddress);

    const request = await contract.populateTransaction.addLiquidity(
      l1Token,
      l1TokenAmount,
      overrides
    );
    const id = await txman.request(request);

    this.state.transactions[id] = {
      id,
      state: "requested",
      toAddress: hubPoolAddress,
      fromAddress: userAddress,
      type: "Add Liquidity",
      description: "Adding Tokens to pool",
      request,
    };

    this.emit(["transactions", id], { ...this.state.transactions[id] });
    await txman.update();
    return id;
  }
  async validateWithdraw(
    l1Token: string,
    userAddress: string,
    lpAmount: BigNumberish
  ) {
    await this.updatePool(l1Token);
    const poolState = this.getPoolState(l1Token);
    if (!this.hasUserState(l1Token, userAddress)) {
      await this.updateUser(l1Token, userAddress);
    }
    const userState = this.getUserState(poolState.l1Token, userAddress);
    return validateWithdraw(poolState, userState, lpAmount);
  }
  async removeTokenLiquidity(
    signer: Signer,
    l1Token: string,
    lpTokenAmount: BigNumberish,
    overrides: Overrides = {}
  ) {
    const { hubPoolAddress } = this.config;
    const userAddress = await signer.getAddress();
    await this.validateWithdraw(l1Token, userAddress, lpTokenAmount);
    const contract = this.getOrCreatePoolContract();
    const txman = this.getOrCreateTransactionManager(signer, userAddress);

    const request = await contract.populateTransaction.removeLiquidity(
      l1Token,
      lpTokenAmount,
      false,
      overrides
    );
    const id = await txman.request(request);

    this.state.transactions[id] = {
      id,
      state: "requested",
      toAddress: hubPoolAddress,
      fromAddress: userAddress,
      type: "Remove Liquidity",
      description: "Withdrawing Tokens from pool",
      request,
    };

    this.emit(["transactions", id], { ...this.state.transactions[id] });
    await txman.update();
    return id;
  }
  async removeEthliquidity(
    signer: Signer,
    lpTokenAmount: BigNumberish,
    overrides: Overrides = {}
  ) {
    const { hubPoolAddress, wethAddress: l1Token } = this.config;
    const userAddress = await signer.getAddress();
    await this.validateWithdraw(l1Token, userAddress, lpTokenAmount);
    const contract = this.getOrCreatePoolContract();
    const txman = this.getOrCreateTransactionManager(signer, userAddress);

    const request = await contract.populateTransaction.removeLiquidity(
      l1Token,
      lpTokenAmount,
      true,
      overrides
    );
    const id = await txman.request(request);

    this.state.transactions[id] = {
      id,
      state: "requested",
      toAddress: hubPoolAddress,
      fromAddress: userAddress,
      type: "Remove Liquidity",
      description: "Withdrawing Eth from pool",
      request,
    };
    this.emit(["transactions", id], { ...this.state.transactions[id] });
    await txman.update();
    return id;
  }
  getPoolState(l1TokenAddress: string): Pool {
    return this.state.pools[l1TokenAddress];
  }
  hasPoolState(l1TokenAddress: string): boolean {
    return Boolean(this.state.pools[l1TokenAddress]);
  }
  setUserState(l1TokenAddress: string, userAddress: string, state: User): User {
    set(this.state, ["users", userAddress, l1TokenAddress], state);
    return state;
  }
  getUserState(l1TokenAddress: string, userAddress: string): User {
    return get(this.state, ["users", userAddress, l1TokenAddress]);
  }
  hasUserState(l1TokenAddress: string, userAddress: string): boolean {
    return has(this.state, ["users", userAddress, l1TokenAddress]);
  }
  hasTxState(id: string): boolean {
    return has(this.state, ["transactions", id]);
  }
  getTxState(id: string): Transaction {
    return get(this.state, ["transactions", id]);
  }
  private async updateAndEmitUser(
    userState: Awaited<ReturnType<UserState["read"]>>,
    poolState: Pool,
    poolEventState: hubPool.EventState
  ): Promise<void> {
    const { l1Token: l1TokenAddress, lpToken } = poolState;
    const { address: userAddress } = userState;
    const transferValue = this.config.hasArchive
      ? await this.calculateLpTransferValue(l1TokenAddress, userState)
      : bnZero;
    const stakeData = await this.resolveStakingData(
      lpToken,
      l1TokenAddress,
      userState
    );
    const tokenEventState = poolEventState[l1TokenAddress];
    const newUserState = this.setUserState(
      l1TokenAddress,
      userAddress,
      joinUserState(
        poolState,
        tokenEventState,
        userState,
        transferValue,
        stakeData.cumulativeBalance,
        stakeData.amountAirdropped
      )
    );
    this.emit(["users", userAddress, l1TokenAddress], newUserState);
  }
  private async updateUserWithTransaction(
    userAddress: string,
    txReceipt: TransactionReceipt
  ): Promise<void> {
    const latestBlock = await this.deps.provider.getBlock("latest");
    const getPoolEventState = this.getOrCreatePoolEvents();
    const l1TokenAddress = getPoolEventState.getL1TokenFromReceipt(txReceipt);
    await this.updatePool(l1TokenAddress, latestBlock);
    const poolState = this.getPoolState(l1TokenAddress);
    const poolEventState = getPoolEventState.readTxReceipt(txReceipt);

    const lpToken = poolState.lpToken;
    const getUserState = this.getOrCreateUserService(userAddress, lpToken);
    const userState = await getUserState.read(latestBlock.number);

    await this.updateAndEmitUser(userState, poolState, poolEventState);
  }
  async updateUser(userAddress: string, l1TokenAddress: string): Promise<void> {
    const latestBlock = await this.deps.provider.getBlock("latest");
    await this.updatePool(l1TokenAddress, latestBlock);

    const poolState = this.getPoolState(l1TokenAddress);
    const lpToken = poolState.lpToken;
    const getPoolEventState = this.getOrCreatePoolEvents();
    const poolEventState = await getPoolEventState.read(
      latestBlock.number,
      l1TokenAddress,
      userAddress
    );

    const getUserState = this.getOrCreateUserService(userAddress, lpToken);
    const userState = await getUserState.read(latestBlock.number);

    await this.updateAndEmitUser(userState, poolState, poolEventState);
  }
  async updatePool(
    l1TokenAddress: string,
    overrideLatestBlock?: Block
  ): Promise<void> {
    // default to 100 block delta unless specified otherwise in config
    const { blockDelta = DEFAULT_BLOCK_DELTA } = this.config;
    const contract = this.getOrCreatePoolContract();
    const pool = new PoolState(contract, this.config.hubPoolAddress);
    const latestBlock =
      overrideLatestBlock || (await this.deps.provider.getBlock("latest"));
    const previousBlock = await this.deps.provider.getBlock(
      latestBlock.number - blockDelta
    );
    const state = await pool.read(
      l1TokenAddress,
      latestBlock.number,
      previousBlock.number
    );

    let rateModel: RateModel | undefined = undefined;
    try {
      // Use the default rate model (i.e. not any of the routeRateModels to project the Pool's APR). This assumes
      // that the default rate model is the most often used, but this may change in future if many different
      // route rate models are set.
      rateModel = await this.configStoreClient.getRateModel(l1TokenAddress);
    } catch (err) {
      // we could swallow this error or just log it since getting the rate model is optional,
      // but we will just emit it to the caller and let them decide what to do with it.
      this.emit(["error"], err as unknown as Error);
    }

    this.state.pools[l1TokenAddress] = joinPoolState(
      state,
      latestBlock,
      previousBlock,
      rateModel
    );
    this.emit(["pools", l1TokenAddress], this.state.pools[l1TokenAddress]);
  }
  async updateTransactions(): Promise<void> {
    for (const txMan of Object.values(this.transactionManagers)) {
      try {
        await txMan.update();
      } catch (err) {
        this.emit(["error"], err as unknown as Error);
      }
    }
  }
  // starts transaction checking intervals, defaults to 30 seconds
  startInterval(delayMs = 30000) {
    assert(
      !this.intervalStarted,
      "Interval already started, try stopping first"
    );
    this.intervalStarted = true;
    loop(async () => {
      assert(this.intervalStarted, "HubPool Interval Stopped");
      await this.updateTransactions();
    }, delayMs).catch((err) => {
      this.emit(["error"], err);
    });
  }
  // starts transaction checking intervals
  stopInterval() {
    this.intervalStarted = false;
  }
}
