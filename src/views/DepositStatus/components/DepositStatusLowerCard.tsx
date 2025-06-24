import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { useHistory } from "react-router-dom";

import { SecondaryButton } from "components/Button";
import { useIsContractAddress } from "hooks/useIsContractAddress";
import {
  chainIdToRewardsProgramName,
  getBridgeUrlWithQueryParams,
  getToken,
} from "utils";
import { FeesCollapsible } from "views/Bridge/components/FeesCollapsible";
import RewardsProgramCTA from "views/Bridge/components/RewardsProgramCTA";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { getReceiveTokenSymbol } from "views/Bridge/utils";
import { useResolveFromBridgePagePayload } from "../hooks/useResolveFromBridgePagePayload";
import { BuildOnAcrossCard } from "./BuildOnAcrossCard";
import { EarnByLpAndStakingCard } from "./EarnByLpAndStakingCard";
import { TwitterShareCard } from "./TwitterShareCard";

export type DepositStatusLowerCardProps = {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  externalProjectId?: string;
  inputTokenSymbol: string;
  outputTokenSymbol: string;
  fromBridgePagePayload?: FromBridgePagePayload;
};

export function DepositStatusLowerCard(props: DepositStatusLowerCardProps) {
  const {
    fromChainId,
    toChainId,
    externalProjectId,
    inputTokenSymbol,
    outputTokenSymbol,
    fromBridgePagePayload,
  } = props;
  const {
    recipient,
    lpFee,
    depositArgs,
    gasFee,
    quotedLimits,
    capitalFee,
    isSwap,
    swapToken,
    swapQuote,
    quote,
    estimatedRewards,
    inputToken,
    outputToken,
    bridgeToken,
    isUniversalSwap,
    universalSwapQuote,
  } = useResolveFromBridgePagePayload(
    fromChainId,
    toChainId,
    inputTokenSymbol,
    outputTokenSymbol,
    fromBridgePagePayload
  );

  const history = useHistory();
  const isReceiverContract = useIsContractAddress(recipient, toChainId);
  const programName = chainIdToRewardsProgramName[toChainId];

  const FeesTable =
    lpFee && gasFee && depositArgs?.initialAmount ? (
      <FeesCollapsible
        fromChainId={fromChainId}
        toChainId={toChainId}
        quotedLimits={quotedLimits}
        gasFee={gasFee}
        lpFee={lpFee}
        capitalFee={capitalFee}
        inputToken={getToken(inputTokenSymbol)}
        outputToken={getToken(
          getReceiveTokenSymbol(
            toChainId,
            inputTokenSymbol,
            outputToken.symbol,
            isReceiverContract
          )
        )}
        parsedAmount={BigNumber.from(depositArgs.initialAmount)}
        isSwap={isSwap}
        swapQuote={swapQuote}
        swapToken={swapToken}
        isQuoteLoading={false}
        estimatedFillTimeSec={quote?.estimatedFillTimeSec}
        universalSwapQuote={universalSwapQuote}
        isUniversalSwap={isUniversalSwap}
        {...estimatedRewards}
      />
    ) : null;

  return (
    <>
      <BuildOnAcrossCard />
      <EarnByLpAndStakingCard
        l1TokenAddress={bridgeToken.mainnetAddress!}
        bridgeTokenSymbol={inputTokenSymbol}
      />
      {programName && (
        <RewardsProgramCTA toChain={toChainId} program={programName} />
      )}
      {fromBridgePagePayload && FeesTable}
      <TwitterShareCard {...props} />
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
