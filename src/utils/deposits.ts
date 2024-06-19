import { LogDescription } from "ethers/lib/utils";
import { getConfig } from "./config";
import { isDefined } from "./sdk";
import { getProvider } from "./providers";
import { SpokePool__factory } from "./typechain";

const config = getConfig();

export class NoV3FundsDepositedLogError extends Error {
  constructor(depositTxHash: string, chainId: number) {
    super(
      `Could not parse log V3FundsDeposited in tx ${depositTxHash} on chain ${chainId}`
    );
  }
}

export class NoFilledV3RelayLogError extends Error {
  constructor(depositId: number, chainId: number) {
    super(
      `Could find related FilledV3Relay for Deposit #${depositId} on chain ${chainId}`
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
  return parsedLogs.find(({ name }) => name === "V3FundsDeposited");
}

export async function getDepositByTxHash(
  depositTxHash: string,
  fromChainId: number
) {
  const fromProvider = getProvider(fromChainId);
  const depositTxReceipt =
    await fromProvider.getTransactionReceipt(depositTxHash);
  if (!depositTxReceipt) {
    throw new Error(
      `Could not fetch tx receipt for ${depositTxHash} on chain ${fromChainId}`
    );
  }

  const block = await fromProvider.getBlock(depositTxReceipt.blockNumber);

  if (depositTxReceipt.status === 0) {
    return {
      depositTxReceipt,
      parsedDepositLog: undefined,
      depositTimestamp: block.timestamp,
    };
  }

  const parsedDepositLog = parseFundsDepositedLog(depositTxReceipt.logs);
  if (!parsedDepositLog) {
    throw new NoV3FundsDepositedLogError(depositTxHash, fromChainId);
  }

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
  if (!depositByTxHash || !depositByTxHash.parsedDepositLog) {
    throw new Error(
      `Could not fetch deposit by tx hash ${depositTxHash} on chain ${fromChainId}`
    );
  }

  const { parsedDepositLog } = depositByTxHash;

  const depositId = Number(parsedDepositLog.args.depositId);
  const destinationSpokePool = config.getSpokePool(toChainId);
  const v3FilledRelayEvents = await destinationSpokePool.queryFilter(
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
  // If we make it to this point, we can be sure that there is exactly one filled relay event
  // that corresponds to the deposit we are looking for.
  // The (depositId, fromChainId) tuple is unique for V3 filled relay events.
  const filledRelayEvent = v3FilledRelayEvents[0];
  if (!isDefined(filledRelayEvent)) {
    throw new NoFilledV3RelayLogError(depositId, toChainId);
  }
  const fillTxBlock = await filledRelayEvent.getBlock();
  return {
    fillTxHashes: v3FilledRelayEvents.map((event) => event.transactionHash),
    fillTxTimestamp: fillTxBlock.timestamp,
    depositByTxHash,
  };
}
