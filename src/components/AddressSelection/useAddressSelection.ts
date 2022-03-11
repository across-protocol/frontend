import { useSelect } from "downshift";
import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { useSendForm } from 'hooks';
import { CHAINS_SELECTION, ChainId, isValidAddress } from "utils";

export default function useAddressSelection() {
	const { isConnected } = useConnection();
	const { toChain, toAddress, fromChain, setToChain, setToAddress } = useSendForm();
	const [address, setAddress] = useState("");
	const [open, setOpen] = useState(false);

	const downshiftState = useSelect({
		items: CHAINS_SELECTION,
		defaultSelectedItem: CHAINS_SELECTION.find(x => x.chainId === toChain),
		selectedItem: CHAINS_SELECTION.find(x => x.chainId === toChain),
		onSelectedItemChange: ({ selectedItem }) => {
			if (selectedItem) {
				setToChain(selectedItem.chainId);
			}
		},
	});

	// keep the address in sync with the form address
	useEffect(() => {
		if (toAddress) {
			setAddress(toAddress);
		}
	}, [toAddress]);

	const toggle = () => {
		// modal is closing, reset address to the current toAddress
		if (!isConnected) return;
		if (open) setAddress(toAddress || address);
		setOpen((oldOpen) => !oldOpen);
	};
	const clearInput = () => {
		setAddress("");
	};

	const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
		setAddress(evt.target.value);
	};
	const isValid = !address || isValidAddress(address);
	const handleSubmit = () => {
		if (isValid && address) {
			setToAddress(address);
			toggle();
		}
	};

	const isL1toL2 = fromChain === ChainId.MAINNET;

	return {
		...downshiftState,
		handleSubmit,
		handleChange,
		clearInput,
		isL1toL2,
		isValid,
		toAddress,
		toChain,
		toggle,
		open,
		address,
		isConnected
	}

}