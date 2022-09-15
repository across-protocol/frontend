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
import useTravellerFlow from "./useTravellerFlow";
const numDots = 4;
const TravellerFlow = () => {
  const { step, setStep } = useTravellerFlow();
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
        <TertiaryButton
          onClick={() => {
            // Return back to view, not sure where yet.
            if (step <= 1) {
              setStep(1);
              return null;
            } else {
              setStep((pv) => pv - 1);
            }
          }}
          size="md"
        >
          {step === 1 ? "Back to Home" : "Back"}
        </TertiaryButton>
        <SecondaryButtonV2
          disabled={step === numDots}
          onClick={() => setStep((pv) => (pv === numDots ? numDots : pv + 1))}
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
