import { useIsWrongNetwork } from "hooks";
import { SuperHeader } from "components";
import { getChainInfo } from "utils";

export function WrongNetworkHeader({
  requiredChainId,
}: {
  requiredChainId?: number;
}) {
  const { isWrongNetwork, isWrongNetworkHandlerWithoutError } =
    useIsWrongNetwork(requiredChainId);

  if (!isWrongNetwork && requiredChainId) {
    return null;
  }

  return (
    <SuperHeader>
      <div>
        You are on the incorrect network. Please{" "}
        <button onClick={isWrongNetworkHandlerWithoutError}>
          switch to {getChainInfo(requiredChainId!)?.name}
        </button>
      </div>
    </SuperHeader>
  );
}
