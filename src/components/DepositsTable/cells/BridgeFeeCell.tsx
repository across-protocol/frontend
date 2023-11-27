import styled from "@emotion/styled";

import { BigNumber } from "ethers";

import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";
import {
  fixedPointAdjustment,
  formatUnits,
  formatWeiPct,
  getConfig,
} from "utils";

type Props = {
  deposit: Deposit;
  width: number;
};

export function BridgeFeeCell({ deposit, width }: Props) {
  const tokenInfo = getConfig().getTokenInfoByAddress(
    deposit.sourceChainId,
    deposit.assetAddr
  );

  const bridgeFeePct = deposit.feeBreakdown?.totalBridgeFeePct
    ? deposit.feeBreakdown.totalBridgeFeePct // this value is more accurate
    : deposit.depositRelayerFeePct; // this value is capped
  return (
    <StyledFeeCell width={width}>
      <Text color="light-200">
        {formatUnits(
          BigNumber.from(deposit.amount)
            .mul(bridgeFeePct)
            .div(fixedPointAdjustment),
          tokenInfo.decimals
        )}{" "}
        {tokenInfo.symbol}
      </Text>
      <Text size="sm" color="grey-400">
        {formatWeiPct(bridgeFeePct || 0, 3)}%
      </Text>
    </StyledFeeCell>
  );
}

const StyledFeeCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
