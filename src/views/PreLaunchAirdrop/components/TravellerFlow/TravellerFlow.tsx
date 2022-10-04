import { DotStepper } from "components";
import {
  Wrapper,
  HeroBlock,
  Title,
  Description,
  DotStepWrapper,
  ButtonWrapper,
  SecondaryButton,
  StyledTertiaryButton,
} from "./TravellerFlow.styles";
import { ButtonV2 } from "components/Buttons/ButtonV2";
import useTravellerFlow from "./useTravellerFlow";
import { setAccountSeenWelcomeTravellerFlow } from "utils/localStorage";
interface Props {
  account: string;
  switchToSplash: () => void;
}
const numDots = 4;
const TravellerFlow: React.FC<Props> = ({ account, switchToSplash }) => {
  const { step, setStep, view, history } = useTravellerFlow();
  const Icon = view.Icon;
  return (
    <Wrapper>
      <HeroBlock>
        <Icon />
      </HeroBlock>
      <Title>{view.title}</Title>
      <Description>{view.description}</Description>
      <ButtonWrapper>
        <StyledTertiaryButton
          onClick={() => {
            // Return back to view, not sure where yet.
            // Change when integrating this into regular view.
            if (step === 1) {
              switchToSplash();
            } else {
              setStep((pv) => Math.max(1, pv - 1));
            }
          }}
          size="md"
        >
          {step === 1 ? "Back to Home" : "Back"}
        </StyledTertiaryButton>
        {step < numDots ? (
          <SecondaryButton
            onClick={() => {
              setStep((pv) => Math.min(pv + 1, numDots));
            }}
            size="md"
          >
            Next
          </SecondaryButton>
        ) : (
          <ButtonV2
            size="md"
            onClick={() => {
              history.push("/");
              setAccountSeenWelcomeTravellerFlow(account);
            }}
          >
            Go to Bridge
          </ButtonV2>
        )}
      </ButtonWrapper>
      <DotStepWrapper>
        <DotStepper numDots={numDots} step={step} />
      </DotStepWrapper>
    </Wrapper>
  );
};

export default TravellerFlow;
