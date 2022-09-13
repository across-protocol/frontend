import { DotStepper } from "components";
import {
  Wrapper,
  HeroBlock,
  Rotate,
  Title,
  Subtitle,
  DotStepWrapper,
} from "./TravellerFlow.styles";
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
      <DotStepWrapper>
        <DotStepper numDots={4} selected={1} />
      </DotStepWrapper>
    </Wrapper>
  );
};

export default TravellerFlow;
