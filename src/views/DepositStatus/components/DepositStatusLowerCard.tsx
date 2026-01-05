import styled from "@emotion/styled";
import { useHistory } from "react-router-dom";

import { SecondaryButton } from "components/Button";
import {
  chainIdToRewardsProgramName,
  getBridgeUrlWithQueryParams,
} from "utils";
import RewardsProgramCTA from "./RewardsProgramCTA";
import { TwitterShareCard } from "./TwitterShare/TwitterShareCard";

export type DepositStatusLowerCardProps = {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  externalProjectId?: string;
  inputTokenSymbol: string;
  outputTokenSymbol: string;
  fillTxElapsedSeconds?: number;
};

export function DepositStatusLowerCard(props: DepositStatusLowerCardProps) {
  const {
    fromChainId,
    toChainId,
    externalProjectId,
    inputTokenSymbol,
    outputTokenSymbol,
  } = props;

  const history = useHistory();
  const programName = chainIdToRewardsProgramName[toChainId];

  return (
    <>
      {programName && (
        <RewardsProgramCTA toChain={toChainId} program={programName} />
      )}
      <TwitterShareCard {...props} />
      <Button
        onClick={() =>
          history.push(
            getBridgeUrlWithQueryParams({
              fromChainId,
              toChainId,
              inputTokenSymbol,
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
