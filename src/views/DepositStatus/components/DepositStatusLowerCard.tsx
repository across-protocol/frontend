import styled from "@emotion/styled";
import { useHistory } from "react-router-dom";

import { SecondaryButton } from "components/Button";
import {
  chainIdToRewardsProgramName,
  getBridgeUrlWithQueryParams,
} from "utils";
import RewardsProgramCTA from "views/Bridge/components/RewardsProgramCTA";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { useResolveFromBridgePagePayload } from "../hooks/useResolveFromBridgePagePayload";

type Props = {
  fromChainId: number;
  toChainId: number;
  externalProjectId?: string;
  inputTokenSymbol: string;
  outputTokenSymbol: string;
  fromBridgePagePayload?: FromBridgePagePayload;
};

export function DepositStatusLowerCard({
  fromChainId,
  toChainId,
  externalProjectId,
  inputTokenSymbol,
  outputTokenSymbol,
  fromBridgePagePayload,
}: Props) {
  const { inputToken } = useResolveFromBridgePagePayload(
    fromChainId,
    toChainId,
    inputTokenSymbol,
    outputTokenSymbol,
    fromBridgePagePayload
  );

  const history = useHistory();
  const programName = chainIdToRewardsProgramName[toChainId];

  return (
    <>
      {programName && (
        <RewardsProgramCTA toChain={toChainId} program={programName} />
      )}
      <Button
        onClick={() =>
          history.push(
            getBridgeUrlWithQueryParams({
              fromChainId,
              toChainId,
              inputTokenSymbol: inputToken.symbol,
              outputTokenSymbol,
              externalProjectId,
            })
          )
        }
      >
        Initiate new transaction
      </Button>
    </>
  );
}

const Button = styled(SecondaryButton)`
  width: 100%;
`;
