import { ethers } from "ethers";
import { getDepositBox } from "./bridge";
import { ChainId, ETH_ADDRESS, TOKENS_LIST } from "./constants";
import { tagAddress } from "./format";

type AcrossSendArgs = {
	l1Recipient: string;
	fromChain: ChainId;
	amount: ethers.BigNumber;
	token: string;
	timestamp: number;
	slowRelayFeePct: ethers.BigNumber;
	instantRelayFeePct: ethers.BigNumber;
	referrer?: string;
}
export async function getAcrossSendTx({ l1Recipient, fromChain, amount, token, timestamp, slowRelayFeePct, instantRelayFeePct, referrer }: AcrossSendArgs) {
	const depositBox = getDepositBox(
		fromChain,
	);
	const isETH = token === ETH_ADDRESS;
	const value = isETH ? amount : ethers.constants.Zero;
	const l2Token = isETH
		? TOKENS_LIST[fromChain][0].address
		: token;


	const tx = await depositBox.populateTransaction.deposit(l1Recipient, l2Token, amount, slowRelayFeePct, instantRelayFeePct, timestamp, { value });

	// do not tag a referrer if data is not provided as a hex string.
	tx.data =
		referrer && ethers.utils.isAddress(referrer)
			? tagAddress(tx.data!, referrer)
			: tx.data;

	return tx;
}