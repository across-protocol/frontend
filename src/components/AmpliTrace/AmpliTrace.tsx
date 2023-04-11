import { useRouteTrace, useWalletTrace } from "hooks";

export function AmpliTrace() {
  useRouteTrace();
  useWalletTrace();

  return <></>;
}
