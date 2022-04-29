import { useSendForm } from "hooks";
import { useConnection } from "state/hooks";

export default function useSendFormComponent() {
  const { fromChain } = useSendForm();
  const { provider, chainId } = useConnection();
  const wrongNetwork =
    fromChain && !!chainId && provider && chainId !== fromChain;
  return {
    wrongNetwork,
    fromChain,
    provider,
    chainId,
  };
}
