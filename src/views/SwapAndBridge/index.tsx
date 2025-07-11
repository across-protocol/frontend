import { LayoutV2 } from "components";
import { EnrichedTokenSelect } from "./components/ChainTokenSelector/SelectorButton";
import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { InputForm } from "./components/InputForm";
import { BigNumber } from "ethers";

export default function SwapAndBridge() {
  const [inputToken, setInputToken] = useState<EnrichedTokenSelect | null>(
    null
  );
  const [outputToken, setOutputToken] = useState<EnrichedTokenSelect | null>(
    null
  );
  const [amount, setAmount] = useState<BigNumber | null>(null);
  const [isAmountOrigin, setIsAmountOrigin] = useState<boolean>(true);

  useEffect(() => {
    console.log(" from inside amount", amount?.toString());
  }, [amount]);

  return (
    <LayoutV2 maxWidth={720}>
      <Wrapper>
        <InputForm
          amount={amount}
          isAmountOrigin={isAmountOrigin}
          inputToken={inputToken}
          setInputToken={setInputToken}
          outputToken={outputToken}
          setOutputToken={setOutputToken}
          setAmount={setAmount}
          setIsAmountOrigin={setIsAmountOrigin}
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
