import { DotStepper } from "components";
import {
  Wrapper,
  HeroBlock,
  Title,
  Description,
  DotStepWrapper,
  ButtonWrapper,
} from "./TravellerFlow.styles";
import { SecondaryButtonV2, TertiaryButton } from "components/Buttons/ButtonV2";
import useTravellerFlow from "./useTravellerFlow";
const numDots = 4;
const TravellerFlow = () => {
  const { step, setStep, view } = useTravellerFlow();
  const Icon = view.Icon;
  return (
    <Wrapper>
      <HeroBlock>
        <Icon />
      </HeroBlock>
      <Title>{view.title}</Title>
      <Description>{view.description}</Description>
      <ButtonWrapper>
        <TertiaryButton
          onClick={() => {
            // Return back to view, not sure where yet.
            // Change when integrating this into regular view.
            setStep((pv) => Math.max(1, pv - 1));
          }}
          size="md"
        >
          {step === 1 ? "Back to Home" : "Back"}
        </TertiaryButton>
        <SecondaryButtonV2
          disabled={step === numDots}
          onClick={() => setStep((pv) => Math.min(pv + 1, numDots))}
          size="md"
        >
          Next
        </SecondaryButtonV2>
      </ButtonWrapper>
      <DotStepWrapper>
        <DotStepper numDots={numDots} step={step} />
      </DotStepWrapper>
    </Wrapper>
  );
};

export default TravellerFlow;
