import styled from "@emotion/styled";
import { useHistory } from "react-router-dom";

import { ReactComponent as ArrowStarRingIcon } from "assets/icons/arrow-star-ring.svg";
import { Text } from "components/Text";
import { SecondaryButton } from "components/Button";
import { useStakingPool } from "hooks/useStakingPool";
import { useAmplitude } from "hooks";
import { formatWeiPct, BRIDGED_USDC_SYMBOLS } from "utils";
import { ampli } from "ampli";

import { EarnActionCard } from "./EarnActionCard";

type Props = {
  l1TokenAddress: string;
  bridgeTokenSymbol: string;
};

export function EarnByLpAndStakingCard({
  l1TokenAddress,
  bridgeTokenSymbol,
}: Props) {
  const { data: selectedRoutePool } = useStakingPool(l1TokenAddress);
  const { addToAmpliQueue } = useAmplitude();
  const history = useHistory();

  return (
    <EarnActionCard
      title={
        <Text color="white">
          Earn{" "}
          <Text as="span" color="teal">
            {selectedRoutePool
              ? formatWeiPct(selectedRoutePool.apyData.maxApy, 3)
              : "-"}
            %
          </Text>{" "}
          by adding liquidity and staking
        </Text>
      }
      subTitle="Add liquidity to any pool on Across and then stake that liquidity to earn a yield"
      LeftIcon={
        <LogoWrapper>
          <ArrowStarRingIcon />
        </LogoWrapper>
      }
      ActionButton={
        <ButtonWrapper>
          <Button
            size="md"
            textColor="teal"
            borderColor="teal-15"
            backgroundColor="black-700"
            onClick={() => {
              const tokenSymbol = BRIDGED_USDC_SYMBOLS.includes(
                bridgeTokenSymbol
              )
                ? "USDC"
                : bridgeTokenSymbol;
              history.push(`/pool?symbol=${tokenSymbol.toLowerCase()}`);
              addToAmpliQueue(() => {
                ampli.earnByAddingLiquidityClicked({
                  action: "onClick",
                  element: "earnByAddingLiquidityAndStakingLink",
                  page: "bridgePage",
                  section: "depositConfirmation",
                });
              });
            }}
          >
            Add liquidity
          </Button>
        </ButtonWrapper>
      }
    />
  );
}

const LogoWrapper = styled.div`
  margin-left: -8px;
  margin-right: -8px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled(SecondaryButton)`
  white-space: nowrap;
`;
