import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { useHistory } from "react-router-dom";

import { SecondaryButton } from "components/Button";
import {
  calcFeesForEstimatedTable,
  getReceiveTokenSymbol,
} from "views/Bridge/utils";
import { useEstimatedRewards } from "views/Bridge/hooks/useEstimatedRewards";
import {
  getToken,
  chainIdToRewardsProgramName,
  getBridgeUrlWithQueryParams,
} from "utils";
import { useIsContractAddress } from "hooks/useIsContractAddress";

import { EarnByLpAndStakingCard } from "./EarnByLpAndStakingCard";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import RewardsProgramCTA from "views/Bridge/components/RewardsProgramCTA";
import { FeesCollapsible } from "views/Bridge/components/FeesCollapsible";

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
    quote,
    quotedLimits,
    depositArgs,
    recipient,
    selectedRoute,
    swapQuote: _swapQuote,
  } = fromBridgePagePayload || {};

  const isReceiverContract = useIsContractAddress(recipient);
  const history = useHistory();

  const isSwap = selectedRoute?.type === "swap";
  const inputToken = getToken(inputTokenSymbol);
  const swapToken = isSwap
    ? getToken(selectedRoute.swapTokenSymbol)
    : undefined;
  const baseToken = swapToken || inputToken;
  const outputTokenInfo = getToken(outputTokenSymbol);
  const programName = chainIdToRewardsProgramName[toChainId];

  const { relayerGasFee, relayerCapitalFee, lpFee: _lpFee } = quote || {};
  const { bridgeFee, swapFee, gasFee, lpFee, swapQuote, capitalFee } =
    calcFeesForEstimatedTable({
      gasFee: relayerGasFee ? BigNumber.from(relayerGasFee.total) : undefined,
      capitalFee: relayerCapitalFee
        ? BigNumber.from(relayerCapitalFee.total)
        : undefined,
      lpFee: _lpFee ? BigNumber.from(_lpFee.total) : undefined,
      isSwap,
      parsedAmount: depositArgs
        ? BigNumber.from(depositArgs.initialAmount)
        : undefined,
      swapQuote: _swapQuote
        ? {
            ..._swapQuote,
            minExpectedInputTokenAmount: BigNumber.from(
              _swapQuote.minExpectedInputTokenAmount
            ),
          }
        : undefined,
    }) || {};

  const estimatedRewards = useEstimatedRewards(
    baseToken,
    toChainId,
    isSwap,
    depositArgs ? BigNumber.from(depositArgs?.initialAmount) : undefined,
    gasFee,
    bridgeFee,
    swapFee
  );

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
      {fromBridgePagePayload && FeesTable}
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

const Button = styled(SecondaryButton)`
  width: 100%;
`;
