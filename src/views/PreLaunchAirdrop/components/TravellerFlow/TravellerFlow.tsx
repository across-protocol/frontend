import {
  Wrapper,
  HeroBlock,
  Rotate,
  Title,
  Subtitle,
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
    </Wrapper>
  );
};

export default TravellerFlow;
