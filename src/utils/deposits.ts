import { LogDescription } from "ethers/lib/utils";
import { getConfig } from "./config";
import { isDefined } from "./defined";
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
): LogDescription | undefined {
  const spokePoolIface = SpokePool__factory.createInterface();
  const parsedLogs = logs.flatMap((log) => {
    try {
      return spokePoolIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });
  // Return either the V2 or V3 log if either is present
  return parsedLogs.find(
    (log) => log.name === "FundsDeposited" || log.name === "V3FundsDeposited"
  );
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
  const destinationSpokePool = config.getSpokePool(toChainId);

  const filledRelayEvents = await destinationSpokePool.queryFilter(
    destinationSpokePool.filters.FilledV3Relay(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      fromChainId,
      depositId
    )
  );

  if (filledRelayEvents.length === 0) {
    throw new Error(
      `Could not find FilledRelay events for depositId ${depositId} on chain ${toChainId}`
    );
  }

  // If we make it to this point, we can be sure that there is exactly one filled relay event
  // that corresponds to the deposit we are looking for.
  // The (depositId, fromChainId) tuple is unique for V3 filled relay events.
  const filledRelayEvent = filledRelayEvents[0];

  if (!isDefined(filledRelayEvent)) {
    throw new Error(
      `Could not find FilledRelay event that fully filed depositId ${depositId} on chain ${toChainId}`
    );
  }

  const fillTxBlock = await filledRelayEvent.getBlock();

  return {
    fillTxHashes: [filledRelayEvent.transactionHash],
    fillTxTimestamp: fillTxBlock.timestamp,
    depositByTxHash,
  };
}
