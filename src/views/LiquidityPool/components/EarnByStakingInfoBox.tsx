import styled from "@emotion/styled";
import { ChevronRight } from "react-feather";
import { Link } from "react-router-dom";

import { ReactComponent as XStarRing } from "assets/x-star-ring.svg";

import { Text } from "components/Text";
import { useStakingPool, useConnection } from "hooks";
import { repeatableTernaryBuilder } from "utils/ternary";
import { formatWeiPct } from "utils";

type Props = {
  selectedToken: {
    l1TokenAddress: string;
    symbol: string;
    logoURI: string;
  };
  selectedPoolAction: "add" | "remove";
};

export function EarnByStakingInfoBox({
  selectedToken,
  selectedPoolAction,
}: Props) {
  const { data, isLoading, isError } = useStakingPool(
    selectedToken.l1TokenAddress
  );
  const { isConnected } = useConnection();

  const showDashIfLoading = repeatableTernaryBuilder(
    !isLoading,
    <Text as="span">-</Text>
  );

  const hasStaked = !data?.userAmountOfLPStaked?.isZero();
  const apyToShow = hasStaked
    ? data?.apyData.rewardsApy
    : data?.apyData.baseRewardsApy;

  const textColor = selectedPoolAction === "add" ? "aqua" : "warning";
  const isStakingPoolEnabled = !!data?.poolEnabled;

  return isError ? (
    <></>
  ) : (
    <Container selectedPoolAction={selectedPoolAction}>
      <UpperRowContainer>
        <LeftIconContainer selectedPoolAction={selectedPoolAction}>
          <XStarRing width={40} height={40} />
        </LeftIconContainer>
        <TextContainer>
          {showDashIfLoading(
            isStakingPoolEnabled ? (
              <Text color="white-100">
                {hasStaked ? "Earning " : "Earn "}
                {showDashIfLoading(
                  <Text color={textColor} as="span">
                    +{formatWeiPct(apyToShow)}%
                  </Text>
                )}
                {hasStaked ? " on staked " : " by staking "}
                {showDashIfLoading(
                  <Text color={textColor} as="span">
                    {selectedToken.symbol}-LP
                  </Text>
                )}
              </Text>
            ) : (
              <Text>Staking is not enabled for {selectedToken.symbol}-LP</Text>
            )
          )}
        </TextContainer>
        {isStakingPoolEnabled && (
          <IconButtonLink
            to={`/rewards/staking/${selectedToken.symbol.toLowerCase()}`}
            selectedPoolAction={selectedPoolAction}
          >
            <ChevronRight strokeWidth="1.5" size={20} />
          </IconButtonLink>
        )}
      </UpperRowContainer>
      {isConnected && (
        <>
          <Divider selectedPoolAction={selectedPoolAction} />
          <LowerRowContainer>
            <Text color="grey-400">Staked LP Tokens</Text>
            {showDashIfLoading(
              <Text color={hasStaked ? "white-100" : "grey-400"} as="span">
                {data?.lpTokenFormatter(data?.userAmountOfLPStaked || 0)} /{" "}
                {data?.lpTokenFormatter(data?.usersTotalLPTokens || 0)}{" "}
              </Text>
            )}
            <Text color={hasStaked ? "white-100" : "grey-400"} as="span">
              {selectedToken.symbol}-LP
            </Text>
            <img
              src={selectedToken.logoURI}
              alt={selectedToken.symbol}
              width={16}
              height={16}
            />
          </LowerRowContainer>
        </>
      )}
    </Container>
  );
}

export default EarnByStakingInfoBox;

type StyledProps = Pick<Props, "selectedPoolAction">;

const Container = styled.div<StyledProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  padding: 12px;
  background: ${({ selectedPoolAction }) =>
    selectedPoolAction === "add"
      ? "rgba(108, 249, 216, 0.05)"
      : "rgba(249, 210, 108, 0.05)"};
  border: 1px solid
    ${({ selectedPoolAction }) =>
      selectedPoolAction === "add"
        ? "rgba(108, 249, 216, 0.15)"
        : "rgba(249, 210, 108, 0.15)"};
  border-radius: 12px;
  width: 100%;
`;

const UpperRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  width: 100%;
`;

const LowerRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;

  div:nth-of-type(1) {
    flex: 1;
  }
`;

const LeftIconContainer = styled.div<StyledProps>`
  display: flex;
  svg {
    width: 40px;
    height: 40px;
  }
  path {
    stroke: ${({ selectedPoolAction }) =>
      selectedPoolAction === "add" ? "#6cf9d8" : "#f9d46c"};
    fill: transparent;
  }
  path:nth-of-type(2) {
    fill: ${({ selectedPoolAction }) =>
      selectedPoolAction === "add" ? "#6cf9d8" : "#f9d46c"};
  }
`;

const TextContainer = styled.div`
  flex: 1;
`;

const IconButtonLink = styled(Link, {
  // Required to remove the console error: `Warning: React does not recognize the `selectedPoolAction` prop on a DOM element.`
  shouldForwardProp: (prop) => prop !== "selectedPoolAction",
})<StyledProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  border: 1px solid
    ${({ selectedPoolAction }) =>
      selectedPoolAction === "add" ? "#6cf9d8" : "#f9d46c"};
  border-radius: 100%;
  align-self: center;
  justify-self: flex-end;

  svg {
    stroke: ${({ selectedPoolAction }) =>
      selectedPoolAction === "add" ? "#6cf9d8" : "#f9d46c"};
  }
`;

export const Divider = styled.div<StyledProps>`
  width: 100%;
  background: ${({ selectedPoolAction }) =>
    selectedPoolAction === "add"
      ? "hsla(166, 92%, 70%, 0.05)"
      : "hsla(43, 92%, 70%, 0.05)"};
  height: 1px;
`;
