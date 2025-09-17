import { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import { QUERIESV2 } from "utils";
import { isValidTxHash } from "utils/transactions";
import { LayoutV2 } from "components";
import NotFound from "views/NotFound";

import { Breadcrumb } from "./components/Breadcrumb";
import { DepositStatusUpperCard } from "./components/DepositStatusUpperCard";
import { DepositStatusLowerCard } from "./components/DepositStatusLowerCard";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";

export default function DepositStatus() {
  const { depositTxHash } = useParams<
    Partial<{
      depositTxHash: string;
    }>
  >();
  const { search, state = {} } = useLocation<{
    fromBridgePagePayload?: FromBridgePagePayload;
  }>();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);

  const originChainId = queryParams.get("originChainId");
  const destinationChainId = queryParams.get("destinationChainId");
  const inputTokenSymbol = queryParams.get("inputTokenSymbol");
  const outputTokenSymbol = queryParams.get("outputTokenSymbol");
  const externalProjectId = queryParams.get("externalProjectId") || undefined;
  if (
    !depositTxHash ||
    !originChainId ||
    !destinationChainId ||
    !inputTokenSymbol
  ) {
    return <NotFound />;
  }

  if (!isValidTxHash(depositTxHash)) {
    return <NotFound custom404Message="Invalid transaction hash" />;
  }

  return (
    <LayoutV2>
      <OuterWrapper>
        <Breadcrumb depositTxHash={depositTxHash} />
        <InnerWrapper>
          <DepositStatusUpperCard
            depositTxHash={depositTxHash}
            fromChainId={Number(originChainId)}
            toChainId={Number(destinationChainId)}
            inputTokenSymbol={inputTokenSymbol}
            outputTokenSymbol={outputTokenSymbol || inputTokenSymbol}
            fromBridgePagePayload={state.fromBridgePagePayload}
            externalProjectId={externalProjectId}
          />
          <DepositStatusLowerCard
            depositTxHash={depositTxHash}
            fromChainId={Number(originChainId)}
            toChainId={Number(destinationChainId)}
            externalProjectId={externalProjectId}
            inputTokenSymbol={inputTokenSymbol}
            outputTokenSymbol={outputTokenSymbol || inputTokenSymbol}
            fromBridgePagePayload={state.fromBridgePagePayload}
          />
        </InnerWrapper>
      </OuterWrapper>
    </LayoutV2>
  );
}

const OuterWrapper = styled.div`
  background-color: transparent;

  width: 100%;

  margin: 48px auto 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media ${QUERIESV2.sm.andDown} {
    margin: 16px auto;
    gap: 16px;
  }
`;

const AnimationFadeInBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(20%);
  }
  to { opacity: 1 }
`;

const InnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px 24px 24px;
  gap: 24px;

  border: 1px solid #3e4047;
  border-radius: 16px;

  overflow: clip;
  background: #34353b;

  animation-name: ${AnimationFadeInBottom};
  animation-duration: 1s;
`;
