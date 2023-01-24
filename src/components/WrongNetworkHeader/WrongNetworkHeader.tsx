import { useIsWrongNetwork } from "hooks";
import { SuperHeader } from "components";
import { chainInfoTable, hubPoolChainId } from "utils";

export function WrongNetworkHeader({
  requiredChainId,
}: {
  requiredChainId?: number;
}) {
  const { isWrongNetwork, isWrongNetworkHandlerWithoutError } =
    useIsWrongNetwork(requiredChainId);

  if (!isWrongNetwork) {
    return null;
  }

  return (
    <SuperHeader>
      <div>
        You are on the incorrect network. Please{" "}
        <button onClick={isWrongNetworkHandlerWithoutError}>
          switch to {chainInfoTable[hubPoolChainId]?.name || hubPoolChainId}
        </button>
      </div>
    </SuperHeader>
  );
}
