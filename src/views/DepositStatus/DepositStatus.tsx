import { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import { QUERIESV2 } from "utils";
import { isValidTxHash } from "utils/transactions";
import { LayoutV2 } from "components";
import NotFound from "views/NotFound";
import { useDepositTracking } from "./hooks/useDepositTracking";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";

import { Breadcrumb } from "./components/Breadcrumb";
import { DepositStatusUpperCard } from "./components/DepositStatusUpperCard";
import { DepositStatusLowerCard } from "./components/DepositStatusLowerCard";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";

export default function DepositStatus() {
  const { depositTxHash } = useParams<
    Partial<{
      depositTxHash: string;
    }>
  >();
  const { search, state = {} } = useLocation<{
    fromBridgeAndSwapPagePayload?: FromBridgeAndSwapPagePayload;
  }>();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);

  const originChainId = queryParams.get("originChainId");
  const destinationChainId = queryParams.get("destinationChainId");
  const inputTokenSymbol = queryParams.get("inputTokenSymbol");
  const outputTokenSymbol = queryParams.get("outputTokenSymbol");
  const externalProjectId = queryParams.get("externalProjectId") || undefined;
  const fromChainId = Number(originChainId);
  const toChainId = Number(destinationChainId);

  const { depositQuery, fillQuery } = useDepositTracking({
    depositTxHash: depositTxHash ?? "",
    fromChainId,
    toChainId,
    fromBridgeAndSwapPagePayload: state.fromBridgeAndSwapPagePayload,
  });

  const depositTxCompletedTime = depositQuery.data?.depositTimestamp;
  const fillTxCompletedTime = fillQuery.data?.fillTxTimestamp;
  const { elapsedSeconds: fillTxElapsedSeconds } = useElapsedSeconds(
    depositTxCompletedTime,
    fillTxCompletedTime
  );

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
            fromChainId={fromChainId}
            toChainId={toChainId}
            inputTokenSymbol={inputTokenSymbol}
            outputTokenSymbol={outputTokenSymbol || inputTokenSymbol}
            fromBridgeAndSwapPagePayload={state.fromBridgeAndSwapPagePayload}
            externalProjectId={externalProjectId}
          />
          <DepositStatusLowerCard
            depositTxHash={depositTxHash}
            fromChainId={fromChainId}
            toChainId={toChainId}
            externalProjectId={externalProjectId}
            inputTokenSymbol={inputTokenSymbol}
            outputTokenSymbol={outputTokenSymbol || inputTokenSymbol}
            fillTxElapsedSeconds={fillTxElapsedSeconds}
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
