import styled from "@emotion/styled";
import { ReactComponent as HammerStarRingIcon } from "assets/icons/hammer-star-ring.svg";
import { SecondaryButton } from "components/Button";
import { Text } from "components/Text";
import { EarnActionCard } from "./EarnActionCard";

export function BuildOnAcrossCard() {
  return (
    <EarnActionCard
      color="teal"
      title={<Text color="white">Build with Across</Text>}
      subTitle="Integrate seamless cross-chain bridging directly into your dApp."
      LeftIcon={
        <LogoWrapper>
          <HammerStarRingIcon />
        </LogoWrapper>
      }
      ActionButton={
        <ButtonWrapper>
          <Button
            size="md"
            textColor="white"
            borderColor="teal-15"
            backgroundColor="black-700"
            onClick={() => {
              window.open(
                "https://docs.across.to/use-cases/instant-bridging-in-your-application",
                "_blank"
              );
            }}
          >
            Start Building
          </Button>
        </ButtonWrapper>
      }
    />
  );
}

const LogoWrapper = styled.div`
  margin-left: -8px;
  margin-right: -8px;
  height: 48px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled(SecondaryButton)`
  white-space: nowrap;
`;
