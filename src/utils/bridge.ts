import { clients } from "@uma/sdk";
import { PROVIDERS, ADDRESSES } from "./constants";

export function getDepositBox(
  chainId: number
): clients.bridgeDepositBox.Instance {
  return clients.bridgeDepositBox.connect(
    ADDRESSES[chainId].BRIDGE,
    PROVIDERS[chainId]
  );
}

export async function getDeposits(chainId: number) {
  const depositBox = getDepositBox(chainId);

  const events = await depositBox.queryFilter({});
  const state: clients.bridgeDepositBox.EventState =
    clients.bridgeDepositBox.getEventState(events);

  return state;
}
