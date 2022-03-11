import { useState, useMemo } from 'react';
import { useSendForm, useBridgeFees } from 'hooks';
import { onboard, TOKENS_LIST, ChainId, receiveAmount } from 'utils';



export default function useSendAction() {
	const { init } = onboard;
	const [isInfoModalOpen, setOpenInfoModal] = useState(false);
	const toggleInfoModal = () => setOpenInfoModal((oldOpen) => !oldOpen);
	const { fromChain, toChain, amount, token } = useSendForm();
	const tokenInfo = TOKENS_LIST[fromChain].find(t => t.address === token);
	const { fees } = useBridgeFees(amount, tokenInfo?.symbol);
	const buttonMsg = () => {
		//if (isSendPending) return "Sending in progress...";
		//if (isApprovalPending) return "Approval in progress...";
		//if (hasToApprove) return "Approve";
		return "Send";
	};
	const amountMinusFees = useMemo(() => {
		if (fromChain === ChainId.MAINNET) {
			return amount;
		}
		return receiveAmount(amount, fees);
	}, [amount, fees, fromChain]);

	const handleClick = () => { };

	const buttonDisabled = false;


	const isWETH = tokenInfo?.symbol === "WETH";
	return {
		init,
		fromChain,
		toChain,
		amount,
		token,
		fees,
		tokenInfo,
		isWETH,
		handleClick,
		amountMinusFees,
		buttonMsg,
		buttonDisabled,
		isInfoModalOpen,
		toggleInfoModal,
	}
}
