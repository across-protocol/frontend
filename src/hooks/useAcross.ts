import { ethers } from 'ethers';
import { clients } from '@uma/sdk';
import { useQueryParams } from "./useQueryParams";
import { useSendForm } from './useSendForm';
import { useBalance } from './useBalance';
import { useBridgeFees } from './useBridgeFees';
import { useAllowance } from './useAllowance';
import { useConnection } from 'state/hooks';
import { useBlock } from './useBlock';
import { getDepositBox, TOKENS_LIST, FEE_ESTIMATION, TransactionError, ETH_ADDRESS, InsufficientBalanceError, FeeTooHighError, InsufficientLiquidityError, PROVIDERS, ChainId } from 'utils';


type SendStatus = "idle" | "validating" | "ready" | "error";

export function useAcross() {
	const { referrer } = useQueryParams();
	const { isConnected, chainId, account, signer } = useConnection();
	const { amount, fromChain, toChain, token, toAddress, error: formError, status: formStatus } = useSendForm();

	const { block } = useBlock(fromChain);
	const { balance } = useBalance(
		token,
		fromChain,
		account
	);
	const depositBox = getDepositBox(fromChain);
	const { allowance } = useAllowance(
		token,
		chainId,
		account,
		depositBox.address,
		block?.number
	);
	const tokenSymbol =
		TOKENS_LIST[fromChain].find(
			(t) => t.address === token
		)?.symbol;
	const { fees, isFetching: isFetchingFees } = useBridgeFees(
		amount,
		tokenSymbol,
	);

	let status: SendStatus = "idle";
	let error: InsufficientBalanceError | FeeTooHighError | InsufficientLiquidityError | TransactionError | undefined;
	const hasToSwitchChain = chainId !== fromChain;
	if (formStatus === "valid" && isConnected) {
		status = hasToSwitchChain ? "error" : "validating";
		status = amount.lt(0) ? "error" : "validating"
		if (balance && fees) {
			const adjustedBalance = token === ETH_ADDRESS ? balance.sub(ethers.utils.parseEther(FEE_ESTIMATION)) : balance;
			status = adjustedBalance.lt(amount) || fees.isAmountTooLow || fees.isLiquidityInsufficient ? "error" : "ready";
			if (adjustedBalance.lt(amount)) {
				error = new InsufficientBalanceError();
			} else if (fees.isAmountTooLow) {
				error = new FeeTooHighError();
			} else if (fees.isLiquidityInsufficient) {
				error = new InsufficientLiquidityError(token);
			}
		}
	}




	const hasToApprove = !!allowance && amount.lte(allowance);


	//const txToSend = fees && toAddress && block && amount.gt(0) ? getAcrossSendTx({ amount, fromChain, l1Recipient: toAddress, token, timestamp: block?.timestamp, slowRelayFeePct: fees?.slowRelayFee.pct, instantRelayFeePct: fees?.instantRelayFee.pct, referrer }) : null;








	return {
		fromChain,
		toChain,
		toAddress,
		amount,
		token,
		error,
		hasToApprove,
		hasToSwitchChain,
		fees,
		status,
		spender: depositBox.address,
	};
}

function approveTx(
	chainId: ChainId,
	spender: string,
	amount: ethers.BigNumber,
	token: string,
) {
	const contract = clients.erc20.connect(token, PROVIDERS[chainId]());
	return contract.populateTransaction.approve(spender, amount);
}