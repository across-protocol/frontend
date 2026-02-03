import { useRouteTrace } from "hooks/useRouteTrace";
import { useWalletTrace } from "hooks/useWalletTrace";

export function AmpliTrace() {
  useRouteTrace();
  useWalletTrace();

  return <></>;
}
