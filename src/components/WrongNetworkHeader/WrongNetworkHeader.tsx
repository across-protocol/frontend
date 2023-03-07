import { useIsWrongNetwork } from "hooks";
import { SuperHeader } from "components";
import { chainInfoTable, hubPoolChainId } from "utils";

export function WrongNetworkHeader({
  requiredChainId = hubPoolChainId,
}: {
  requiredChainId?: number;
}) {
  const { isWrongNetwork, isWrongNetworkHandlerWithoutError } =
    useIsWrongNetwork(requiredChainId);

  if (!isWrongNetwork || !requiredChainId) {
    return null;
  }

  return (
    <SuperHeader>
      <div>
        You are on the incorrect network. Please{" "}
        <button onClick={isWrongNetworkHandlerWithoutError}>
          switch to{" "}
          {chainInfoTable[requiredChainId]?.name ??
            `network ID: ${requiredChainId}`}
        </button>
      </div>
    </SuperHeader>
  );
}
