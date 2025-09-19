import { LayoutV2 } from "components";
import { EnrichedTokenSelect } from "./components/ChainTokenSelector/SelectorButton";
import styled from "@emotion/styled";
import { useCallback, useState } from "react";
import { InputForm } from "./components/InputForm";
import { BigNumber } from "ethers";
import ConfirmationButton from "./components/ConfirmationButton";
import useSwapQuote from "./hooks/useSwapQuote";
import { useConnection } from "hooks";
import { useHistory } from "react-router-dom";

export default function SwapAndBridge() {
  const [inputToken, setInputToken] = useState<EnrichedTokenSelect | null>(
    null
  );
  const [outputToken, setOutputToken] = useState<EnrichedTokenSelect | null>(
    null
  );
  const [amount, setAmount] = useState<BigNumber | null>(null);
  const [isAmountOrigin, setIsAmountOrigin] = useState<boolean>(true);
  const { signer } = useConnection();
  const history = useHistory();

  const { data: swapData, isLoading: isUpdateLoading } = useSwapQuote({
    origin: inputToken
      ? {
          address: inputToken.address,
          chainId: inputToken.chainId,
        }
      : null,
    destination: outputToken
      ? {
          address: outputToken.address,
          chainId: outputToken.chainId,
        }
      : null,
    amount: amount,
    isInputAmount: isAmountOrigin,
  });

  // Handle confirmation (placeholder for now)
  const handleConfirm = useCallback(async () => {
    if (!swapData || !signer) {
      return;
    }

    if (swapData.approvalTxns?.length > 0) {
      for (const approvalTxn of swapData.approvalTxns) {
        await signer.sendTransaction({
          data: approvalTxn.data,
          to: approvalTxn.to,
          chainId: approvalTxn.chainId,
        });
      }
    }

    const tx = await signer.sendTransaction({
      data: swapData.swapTx.data,
      to: swapData.swapTx.to,
      chainId: swapData.swapTx.chainId,
    });

    history.push(
      `/bridge/${tx.hash}?originChainId=${inputToken?.chainId}&destinationChainId=${outputToken?.chainId}&inputTokenSymbol=${inputToken?.symbol}&outputTokenSymbol=${outputToken?.symbol}&referrer=`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapData, signer]);

  return (
    <LayoutV2 maxWidth={720}>
      <Wrapper>
        <InputForm
          inputToken={inputToken}
          setInputToken={setInputToken}
          outputToken={outputToken}
          setOutputToken={setOutputToken}
          setAmount={setAmount}
          isAmountOrigin={isAmountOrigin}
          setIsAmountOrigin={setIsAmountOrigin}
          isQuoteLoading={isUpdateLoading}
          expectedOutputAmount={swapData?.expectedOutputAmount}
          expectedInputAmount={swapData?.inputAmount}
        />
        <ConfirmationButton
          inputToken={inputToken}
          outputToken={outputToken}
          amount={amount}
          swapQuote={swapData || null}
          isQuoteLoading={isUpdateLoading}
          onConfirm={handleConfirm}
        />
      </Wrapper>
    </LayoutV2>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;

  gap: 16px;

  align-items: center;
  justify-content: center;

  width: 100%;

  padding-top: 64px;
`;
