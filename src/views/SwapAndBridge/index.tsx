import { LayoutV2 } from "components";
import { EnrichedTokenSelect } from "./components/ChainTokenSelector/SelectorButton";
import styled from "@emotion/styled";
import { useState } from "react";
import { InputForm } from "./components/InputForm";
import { BigNumber } from "ethers";
import ConfirmationButton from "./components/ConfirmationButton";
import useSwapQuote from "./hooks/useSwapQuote";

export default function SwapAndBridge() {
  const [inputToken, setInputToken] = useState<EnrichedTokenSelect | null>(
    null
  );
  const [outputToken, setOutputToken] = useState<EnrichedTokenSelect | null>(
    null
  );
  const [amount, setAmount] = useState<BigNumber | null>(null);
  const [isAmountOrigin, setIsAmountOrigin] = useState<boolean>(true);

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
  const handleConfirm = async () => {
    console.log("Confirming swap...", {
      swapData,
      inputToken,
      outputToken,
      amount,
    });
    // TODO: Implement actual swap confirmation logic
  };

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
