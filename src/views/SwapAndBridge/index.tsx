import { LayoutV2 } from "components";
import SelectorButton, {
  EnrichedTokenSelect,
} from "./components/ChainTokenSelector/SelectorButton";
import styled from "@emotion/styled";
import { useState } from "react";

export default function SwapAndBridge() {
  const [, setSelectedToken] =
    useState<EnrichedTokenSelect | null>(null);
  const defaultToken = {
    chainId: 8453,
    symbolUri: "https://token-icons.s3.amazonaws.com/eth.png",
    symbol: "ETH",
  };

  return (
    <LayoutV2 maxWidth={720}>
      <Wrapper>
        Origin
        <SelectorButton
          defaultToken={defaultToken}
          onSelect={setSelectedToken}
          isOriginToken={true}
        />
        Destination
        <SelectorButton
          defaultToken={defaultToken}
          onSelect={setSelectedToken}
          isOriginToken={false}
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
  height: 100vh;
`;
