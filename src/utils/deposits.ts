import { LogDescription } from "ethers/lib/utils";
import axios from "axios";

import { getConfig } from "./config";
import { getBlockForTimestamp, isDefined } from "./sdk";
import { getProvider } from "./providers";
import { SpokePool__factory } from "./typechain";
import { rewardsApiUrl } from "./constants";

const config = getConfig();

export class NoFundsDepositedLogError extends Error {
  constructor(depositTxHash: string, chainId: number) {
    super(
      `Could not parse log FundsDeposited in tx ${depositTxHash} on chain ${chainId}`
    );
  }
}

export class NoFilledRelayLogError extends Error {
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
  return parsedLogs.find(({ name }) =>
    [
      "V3FundsDeposited", // NOTE: kept for backwards compatibility
      "FundsDeposited", // NOTE: this is the new name for the event
    ].includes(name)
  );
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
    throw new NoFundsDepositedLogError(depositTxHash, fromChainId);
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
  const depositId = parsedDepositLog.args.depositId;
  const provider = getProvider(toChainId);

  try {
    const { data } = await axios.get<{
      status: "filled" | "pending";
      fillTx: string | null;
    }>(`${rewardsApiUrl}/deposit/status`, {
      params: {
        depositId: depositId.toString(),
        originChainId: fromChainId,
      },
    });

    if (data?.status === "filled" && data.fillTx) {
      const fillTxReceipt = await provider.getTransactionReceipt(data.fillTx);
      const fillTxBlock = await provider.getBlock(fillTxReceipt.blockNumber);
      return {
        fillTxHashes: [data.fillTx],
        fillTxTimestamp: fillTxBlock.timestamp,
        depositByTxHash,
      };
    }
  } catch (e) {
    // If the deposit is not found, we can assume it is not indexed yet.
    // We continue to look for the filled relay event via RPC.
  }

  const blockForTimestamp = await getBlockForTimestamp(
    provider,
    depositByTxHash.depositTimestamp
  );
  const destinationSpokePool = config.getSpokePool(toChainId);
  const [legacyFilledRelayEvents, newFilledRelayEvents] = await Promise.all([
    destinationSpokePool.queryFilter(
      destinationSpokePool.filters.FilledV3Relay(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        fromChainId,
        depositId
      ),
      blockForTimestamp
    ),
    destinationSpokePool.queryFilter(
      destinationSpokePool.filters.FilledRelay(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        fromChainId,
        depositId
      ),
      blockForTimestamp
    ),
  ]);
  const filledRelayEvents = [
    ...legacyFilledRelayEvents,
    ...newFilledRelayEvents,
  ];
  // If we make it to this point, we can be sure that there is exactly one filled relay event
  // that corresponds to the deposit we are looking for.
  // The (depositId, fromChainId) tuple is unique for V3 filled relay events.
  const filledRelayEvent = filledRelayEvents[0];
  if (!isDefined(filledRelayEvent)) {
    throw new NoFilledRelayLogError(depositId, toChainId);
  }
  const fillTxBlock = await filledRelayEvent.getBlock();
  return {
    fillTxHashes: filledRelayEvents.map((event) => event.transactionHash),
    fillTxTimestamp: fillTxBlock.timestamp,
    depositByTxHash,
  };
}
