import React, { useLayoutEffect } from "react";
import { useBlocks, useSend } from "state/hooks";
import { PROVIDERS } from "utils";

const BlockPoller: React.FC = () => {
  const { toChain } = useSend();
  const { setBlock } = useBlocks(toChain);
  useLayoutEffect(() => {
    // subscribe to new blocks
    const provider = PROVIDERS[toChain]();
    provider.on("block", async (blockNumber: number) => {
      const block = await provider.getBlock(blockNumber);
      setBlock({ ...block, blockNumber });
    });
    return () => {
      provider.removeAllListeners();
    };
  }, [setBlock, toChain]);
  return null;
};

export default BlockPoller;
