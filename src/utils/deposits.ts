import { getConfig } from "./config";
import { getProvider } from "./providers";
import { SpokePool__factory } from "./typechain";

const config = getConfig();

export class NoFundsDepositedLogError extends Error {
  constructor(depositTxHash: string, chainId: number) {
    super(
      `Could not parse log FundsDeposited in tx ${depositTxHash} on chain ${chainId}`
    );
  }
}

export function parseFundsDepositedLog(
  logs: Array<{
    topics: string[];
    data: string;
  }>
) {
  const spokePoolIface = SpokePool__factory.createInterface();
  const parsedLogs = logs.flatMap((log) => {
    try {
      return spokePoolIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });
  return parsedLogs.find((log) => log.name === "FundsDeposited");
}

export async function getDepositByTxHash(
  depositTxHash: string,
  fromChainId: number
) {
  const fromProvider = getProvider(fromChainId);

  const depositTxReceipt = await fromProvider.getTransactionReceipt(
    depositTxHash
  );

  if (!depositTxReceipt) {
    throw new Error(
      `Could not fetch tx receipt for ${depositTxHash} on chain ${fromChainId}`
    );
  }

  const parsedDepositLog = parseFundsDepositedLog(depositTxReceipt.logs);

  if (!parsedDepositLog) {
    throw new NoFundsDepositedLogError(depositTxHash, fromChainId);
  }

  const block = await fromProvider.getBlock(depositTxReceipt.blockNumber);

  return {
    depositTxReceipt,
    parsedDepositLog,
    depositTimestamp: block.timestamp,
  };
}

export async function getFillByDepositTxHash(
  depositTxHash: string,
  fromChainId: number,
  toChainId: number,
  depositByTxHash: Awaited<ReturnType<typeof getDepositByTxHash>>
) {
  if (!depositByTxHash) {
    throw new Error(
      `Could not fetch deposit by tx hash ${depositTxHash} on chain ${fromChainId}`
    );
  }

  const { parsedDepositLog } = depositByTxHash;

  const depositId = Number(parsedDepositLog.args.depositId);
  const depositor = String(parsedDepositLog.args.depositor);
  const destinationSpokePool = config.getSpokePool(toChainId);
  const filledRelayEvents = await destinationSpokePool.queryFilter(
    destinationSpokePool.filters.FilledRelay(
      undefined,
      undefined,
      undefined,
      undefined,
      fromChainId,
      undefined,
      undefined,
      undefined,
      depositId,
      undefined,
      undefined,
      depositor
    )
  );

  if (!filledRelayEvents.length) {
    throw new Error(
      `Could not find FilledRelay events for depositId ${depositId} on chain ${toChainId}`
    );
  }

  const filledRelayEvent = filledRelayEvents[0];
  const fillTxBlock = await filledRelayEvent.getBlock();

  return {
    fillTxHashes: filledRelayEvents.map((event) => event.transactionHash),
    fillTxTimestamp: fillTxBlock.timestamp,
    depositByTxHash,
  };
}
