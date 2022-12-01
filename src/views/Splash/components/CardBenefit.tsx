import styled from "@emotion/styled";
import { Text } from "components/Text";
import { QUERIESV2 } from "utils";
import { ReactComponent as BackgroundVector } from "assets/prelaunch-card-background-vector.svg";

type CardBenefitProp = {
  title: string;
  icon: React.FC;
  description: string;
};

const CardBenefit = ({ title, icon: Icon, description }: CardBenefitProp) => (
  <Wrapper>
    <WrapperBackground />
    <TitleIconWrapper>
      <Icon />
      <Text size="xl" color="white-100">
        {title}
      </Text>
    </TitleIconWrapper>
    <Text size="lg" color="white-88">
      {description}
    </Text>
  </Wrapper>
);

export default CardBenefit;

const Wrapper = styled.div`
  position: relative;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  gap: 16px;
  isolation: isolate;
  border: 1px solid #3e4047;
  background: #2d2e33;

  overflow: clip;

  z-index: 1;

  filter: drop-shadow(0px 40px 96px rgba(0, 0, 0, 0.2));
  border-radius: 16px;

  transition: filter 0.3s;

  &:hover {
    filter: drop-shadow(0px 40px 96px rgba(0, 0, 0, 0.45));
  }

  @media ${QUERIESV2.sm.andDown} {
    gap: 12px;
    padding: 16px;
    svg {
      height: 24px;
      width: 24px;
    }
  }
`;

const TitleIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
  z-index: 1;
`;

const WrapperBackground = styled(BackgroundVector)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100% !important;
  height: 100% !important;
  z-index: -1;
`;
