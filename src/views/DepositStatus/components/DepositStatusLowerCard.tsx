import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { useHistory } from "react-router-dom";

import { SecondaryButton } from "components/Button";
import { useIsContractAddress } from "hooks/useIsContractAddress";
import {
  COLORS,
  chainIdToRewardsProgramName,
  getBridgeUrlWithQueryParams,
  getToken,
} from "utils";
import EstimatedTable from "views/Bridge/components/EstimatedTable";
import { getReceiveTokenSymbol } from "views/Bridge/utils";

import RewardsProgramCTA from "views/Bridge/components/RewardsProgramCTA";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { useResolveFromBridgePagePayload } from "../hooks/useResolveFromBridgePagePayload";
import { EarnByLpAndStakingCard } from "./EarnByLpAndStakingCard";

type Props = {
  fromChainId: number;
  toChainId: number;
  inputTokenSymbol: string;
  outputTokenSymbol: string;
  fromBridgePagePayload?: FromBridgePagePayload;
};

export function DepositStatusLowerCard({
  fromChainId,
  toChainId,
  inputTokenSymbol,
  outputTokenSymbol,
  fromBridgePagePayload,
}: Props) {
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
    baseToken,
  } = useResolveFromBridgePagePayload(
    toChainId,
    inputTokenSymbol,
    fromBridgePagePayload
  );

  const history = useHistory();
  const isReceiverContract = useIsContractAddress(recipient);
  const outputTokenInfo = getToken(outputTokenSymbol);
  const programName = chainIdToRewardsProgramName[toChainId];

  const FeesTable =
    lpFee && gasFee && depositArgs?.initialAmount ? (
      <EstimatedTable
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
            outputTokenInfo.symbol,
            isReceiverContract
          )
        )}
        parsedAmount={BigNumber.from(depositArgs.initialAmount)}
        isSwap={isSwap}
        swapQuote={swapQuote}
        swapToken={swapToken}
        isQuoteLoading={false}
        estimatedFillTimeSec={quote?.estimatedFillTimeSec}
        {...estimatedRewards}
      />
    ) : null;

  return (
    <>
      <EarnByLpAndStakingCard
        l1TokenAddress={baseToken.mainnetAddress!}
        bridgeTokenSymbol={inputTokenSymbol}
      />
      {programName && (
        <RewardsProgramCTA toChain={toChainId} program={programName} />
      )}
      {fromBridgePagePayload && (
        <>
          <Divider />
          {FeesTable}
        </>
      )}
      <Divider />
      <Button
        onClick={() =>
          history.push(
            getBridgeUrlWithQueryParams({
              fromChainId,
              toChainId,
              inputTokenSymbol: baseToken.symbol,
              outputTokenSymbol,
            })
          )
        }
      >
        Initiate new transaction
      </Button>
    </>
  );
}

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${COLORS["grey-600"]};
`;

const Button = styled(SecondaryButton)`
  width: 100%;
`;
