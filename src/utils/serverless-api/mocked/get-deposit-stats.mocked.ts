export function getDepositStatsMocked(): Promise<{
  totalDeposits: number;
  avgFillTime: number;
  totalVolumeUsd: number;
}> {
  return Promise.resolve({
    totalDeposits: 200,
    avgFillTime: 200,
    totalVolumeUsd: 100000,
  });
}
