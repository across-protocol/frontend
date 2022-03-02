import { useLayoutEffect, useEffect, useState } from 'react'
import { PROVIDERS, ChainId } from 'utils';



/**
 * 
 * @param chainId The chain Id of the chain to poll for new blocks.
 * @returns The latest block number of the chain, if fetched.
 */
export function useBlockNumber(chainId: ChainId): number | undefined {
	const [blockNumber, setBlockNumber] = useState<number | undefined>();
	useLayoutEffect(() => {
		const provider = PROVIDERS[chainId]();
		if (!blockNumber) {
			provider.getBlockNumber().then(setBlockNumber);
		}
	}, [blockNumber, chainId]);
	useEffect(() => {
		const provider = PROVIDERS[chainId]();
		provider.on('block', (blockNumber) => {
			setBlockNumber(blockNumber);
		});
		return () => {
			provider.removeAllListeners('block');
		}
	}, [chainId])
	return blockNumber;
}