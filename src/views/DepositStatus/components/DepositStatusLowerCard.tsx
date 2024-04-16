import styled from "@emotion/styled";
import { utils } from "ethers";
import { useHistory } from "react-router-dom";

import { SecondaryButton } from "components/Button";
import EstimatedTable from "views/Bridge/components/EstimatedTable";
import { getReceiveTokenSymbol } from "views/Bridge/utils";
import { useEstimatedRewards } from "views/Bridge/hooks/useEstimatedRewards";
import { getToken, COLORS } from "utils";
import { useIsContractAddress } from "hooks/useIsContractAddress";

import { EarnByLpAndStakingCard } from "./EarnByLpAndStakingCard";
import { FromBridgePagePayload } from "../types";
import ReferralCTA from "views/Bridge/components/ReferralCTA";
import { useRewardToken } from "hooks/useRewardToken";

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
  const { quote } = fromBridgePagePayload || {};

  const isReceiverContract = useIsContractAddress(quote?.recipient);
  const history = useHistory();

  const inputTokenInfo = getToken(inputTokenSymbol);
  const outputTokenInfo = getToken(outputTokenSymbol);
  const { programName } = useRewardToken(toChainId);

  const gasFee = utils.parseUnits(
    quote?.relayGasFeeTotal || "0",
    tokenInfo.decimals
  );
  const bridgeFee = utils
    .parseUnits(quote?.totalBridgeFee || "0", tokenInfo.decimals)
    .sub(utils.parseUnits(quote?.relayGasFeeTotal || "0", tokenInfo.decimals));
  const estimatedRewards = useEstimatedRewards(
    tokenInfo,
    toChainId,
    gasFee,
    bridgeFee
  );

  const FeesTable = quote ? (
    <EstimatedTable
      fromChainId={fromChainId}
      toChainId={toChainId}
      estimatedTime={quote.expectedFillTimeInMinutes}
      gasFee={utils.parseUnits(quote.relayGasFeeTotal, inputTokenInfo.decimals)}
      bridgeFee={utils
        .parseUnits(quote.totalBridgeFee, inputTokenInfo.decimals)
        .sub(utils.parseUnits(quote.relayGasFeeTotal, inputTokenInfo.decimals))}
      totalReceived={utils.parseUnits(quote.toAmount, inputTokenInfo.decimals)}
      token={inputTokenInfo}
      receiveToken={getToken(
        getReceiveTokenSymbol(
          toChainId,
          inputTokenInfo.symbol,
          outputTokenInfo.symbol,
          isReceiverContract
        )
      )}
      {...estimatedRewards}
    />
  ) : null;

  return (
    <>
      <EarnByLpAndStakingCard
        l1TokenAddress={inputTokenInfo.mainnetAddress!}
        bridgeTokenSymbol={inputTokenSymbol}
      />
      <ReferralCTA program={programName} />
      {fromBridgePagePayload && (
        <>
          <Divider />
          {FeesTable}
        </>
      )}
      <Divider />
      <Button onClick={() => history.push("/bridge")}>
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
