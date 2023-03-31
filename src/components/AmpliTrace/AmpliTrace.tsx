import { useRouteTrace, useWalletTrace } from "hooks";

import { useLoadAmpli } from "./useLoadAmpli";
import { useInitialUserPropTraces } from "./useInitialUserPropTraces";

export function AmpliTrace() {
  const { isAmpliLoaded } = useLoadAmpli();

  const { areInitialUserPropsSet } = useInitialUserPropTraces(isAmpliLoaded);

  useRouteTrace(areInitialUserPropsSet);
  useWalletTrace(areInitialUserPropsSet);

  return <></>;
}
