import { useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useQueryParams } from "./useQueryParams";
import { useSendForm } from './useSendForm';
import { useBalance } from './useBalance';
import { useBridgeFees } from './useBridgeFees';
import { useAllowance } from './useAllowance';
import { useConnection } from 'state/hooks';
import { useBlock } from './useBlock';
import { getDepositBox, TOKENS_LIST, MAX_APPROVAL_AMOUNT, FEE_ESTIMATION, isValidAddress, tagAddress, TransactionError, ETH_ADDRESS } from 'utils';
import { useERC20 } from './useERC20';

export function useAcross() {
	const { referrer } = useQueryParams();
	const { isConnected, chainId, account, signer } = useConnection();
	const { amount, fromChain, toChain, token, toAddress, error } = useSendForm();

	const { block } = useBlock(fromChain);
	const { balance, status: balanceStatus } = useBalance(
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

	const canApprove = balanceStatus === "success" && balance && balance.gte(amount) && amount.gte(0);
	const hasToApprove = Boolean(allowance?.lt(amount));
	const hasToSwitchChain =
		isConnected && fromChain !== chainId;


	const { approve: rawApprove } = useERC20(token);
	async function approve() {
		return rawApprove({
			amount: MAX_APPROVAL_AMOUNT,
			spender: depositBox.address,
			signer,
		});
	}



	const canSend = useMemo(
		() =>
			fromChain &&
			block &&
			toChain &&
			amount &&
			token &&
			fees &&
			!isFetchingFees &&
			toAddress &&
			isValidAddress(toAddress) &&
			!hasToApprove &&
			!hasToSwitchChain &&
			!error &&
			!fees.isAmountTooLow &&
			!fees.isLiquidityInsufficient &&
			balance &&
			balance
				.sub(
					token === ETH_ADDRESS
						? ethers.BigNumber.from(ethers.utils.parseEther(FEE_ESTIMATION))
						: ethers.BigNumber.from("0")
				)
				.gte(amount),
		[fromChain, block, toChain, amount, token, fees, isFetchingFees, toAddress, hasToApprove, hasToSwitchChain, error, balance]
	);

	const send = useCallback(async () => {
		if (
			!signer ||
			!canSend ||
			!fees ||
			isFetchingFees ||
			!toAddress ||
			!block
		) {
			return {};
		}

		try {
			const depositBox = getDepositBox(
				fromChain,
				signer
			);
			const isETH = token === ethers.constants.AddressZero;
			const value = isETH ? amount : ethers.constants.Zero;
			const l2Token = isETH
				? TOKENS_LIST[fromChain][0].address
				: token;
			const { instantRelayFee, slowRelayFee } = fees;
			let timestamp = block.timestamp;

			const data = depositBox.interface.encodeFunctionData("deposit", [
				toAddress,
				l2Token,
				amount,
				slowRelayFee.pct,
				instantRelayFee.pct,
				timestamp,
			]);

			// do not tag a referrer if data is not provided as a hex string.
			const taggedData =
				referrer && ethers.utils.isAddress(referrer)
					? tagAddress(data, referrer)
					: data;
			const tx = await signer.sendTransaction({
				data: taggedData,
				value,
				to: depositBox.address,
			});
			return { tx, fees };
		} catch (e) {
			throw new TransactionError(
				depositBox.address,
				"deposit",
				toAddress,
				token,
				amount,
				fees.slowRelayFee.pct,
				fees.instantRelayFee.pct,
				block.timestamp
			);
		}
	}, [signer, canSend, fees, isFetchingFees, toAddress, block, fromChain, token, amount, referrer, depositBox.address]);

	return {
		fromChain,
		toChain,
		toAddress,
		amount,
		token,
		error,
		canSend,
		canApprove,
		hasToApprove,
		hasToSwitchChain,
		send,
		approve,
		fees,
		spender: depositBox.address,
	};
}