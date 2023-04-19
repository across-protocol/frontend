import { SpokePool__factory } from "./typechain";

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
