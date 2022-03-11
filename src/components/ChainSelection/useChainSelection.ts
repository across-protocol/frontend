import { useSelect } from "downshift";
import { useConnection } from "state/hooks";
import { useSendForm } from 'hooks';
import { UnsupportedChainIdError, CHAINS, CHAINS_SELECTION, switchChain, onboard } from "utils";


export default function useChainSelection() {
	const { init } = onboard;
	const { isConnected, provider, chainId, error } = useConnection();
	const { fromChain, setFromChain } = useSendForm();

	const wrongNetworkSend =
		provider &&
		chainId &&
		(error instanceof UnsupportedChainIdError ||
			chainId !== fromChain);

	const buttonText = wrongNetworkSend
		? `Switch to ${CHAINS[fromChain].name}`
		: !isConnected
			? "Connect Wallet"
			: null;

	const handleClick = () => {
		if (!provider) {
			init();
		} else if (wrongNetworkSend) {
			switchChain(provider, fromChain);
		}
	};

	const downshiftState = useSelect({
		items: CHAINS_SELECTION,
		defaultSelectedItem: CHAINS_SELECTION.find(x => x.chainId === fromChain),
		selectedItem: CHAINS_SELECTION.find(x => x.chainId === fromChain),
		onSelectedItemChange: ({ selectedItem }) => {
			if (selectedItem) {
				setFromChain(selectedItem.chainId);
			}
		},
	});
	return { ...downshiftState, buttonText, handleClick, isConnected, wrongNetworkSend, fromChain };
}