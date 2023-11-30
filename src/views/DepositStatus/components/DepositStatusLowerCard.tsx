import styled from "@emotion/styled";
import { utils } from "ethers";
import { useHistory } from "react-router-dom";

import { SecondaryButton } from "components/Button";
import EstimatedTable from "views/Bridge/components/EstimatedTable";
import { getReceiveTokenSymbol } from "views/Bridge/utils";
import { getToken, COLORS } from "utils";
import { useIsContractAddress } from "hooks/useIsContractAddress";

import { EarnByLpAndStakingCard } from "./EarnByLpAndStakingCard";
import { FromBridgePagePayload } from "../types";
import ReferralCTA from "views/Bridge/components/ReferralCTA";
import { useRewardToken } from "hooks/useRewardToken";

type Props = {
  fromChainId: number;
  toChainId: number;
  bridgeTokenSymbol: string;
  fromBridgePagePayload?: FromBridgePagePayload;
};

export function DepositStatusLowerCard({
  fromChainId,
  toChainId,
  bridgeTokenSymbol,
  fromBridgePagePayload,
}: Props) {
  const { quote } = fromBridgePagePayload || {};

  const isReceiverContract = useIsContractAddress(quote?.recipient);
  const history = useHistory();

  const tokenInfo = getToken(bridgeTokenSymbol);
  const { programName } = useRewardToken(toChainId);

  const FeesTable = quote ? (
    <EstimatedTable
      fromChainId={fromChainId}
      toChainId={toChainId}
      estimatedTime={quote.expectedFillTimeInMinutes}
      gasFee={utils.parseUnits(quote.relayGasFeeTotal, tokenInfo.decimals)}
      bridgeFee={utils
        .parseUnits(quote.totalBridgeFee, tokenInfo.decimals)
        .sub(utils.parseUnits(quote.relayGasFeeTotal, tokenInfo.decimals))}
      totalReceived={utils.parseUnits(quote.toAmount, tokenInfo.decimals)}
      token={tokenInfo}
      receiveToken={getToken(
        getReceiveTokenSymbol(toChainId, tokenInfo.symbol, isReceiverContract)
      )}
    />
  ) : null;

  return (
    <>
      <EarnByLpAndStakingCard
        l1TokenAddress={tokenInfo.mainnetAddress!}
        bridgeTokenSymbol={bridgeTokenSymbol}
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
