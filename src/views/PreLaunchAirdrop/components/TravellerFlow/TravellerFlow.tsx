import { DotStepper } from "components";
import {
  Wrapper,
  HeroBlock,
  Rotate,
  Title,
  Subtitle,
  DotStepWrapper,
  ButtonWrapper,
} from "./TravellerFlow.styles";
import { SecondaryButtonV2, TertiaryButton } from "components/Buttons/ButtonV2";
const TravellerFlow = () => {
  return (
    <Wrapper>
      <HeroBlock>
        <Rotate />
      </HeroBlock>
      <Title>Welcome, Bridge Traveller.</Title>
      <Subtitle>
        Hello. We detect that you’ve traveled far from home. Welcome to Across.
      </Subtitle>
      <ButtonWrapper>
        <TertiaryButton size="md">Back to Home</TertiaryButton>
        <SecondaryButtonV2 size="md">Next</SecondaryButtonV2>
      </ButtonWrapper>
      <DotStepWrapper>
        <DotStepper numDots={4} selected={1} />
      </DotStepWrapper>
    </Wrapper>
  );
};

export default TravellerFlow;
