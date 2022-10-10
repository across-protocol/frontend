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
  Rotate,
  Bolt,
  Heart,
  Present,
} from "./TravellerFlow.styles";
import { ButtonV2 } from "components/Buttons/ButtonV2";
import useTravellerFlow from "./useTravellerFlow";
import { setAccountSeenWelcomeTravellerFlow } from "utils/localStorage";
import { Link } from "react-router-dom";
interface Props {
  account: string;
  switchToSplash: () => void;
}
const numDots = 4;
const TravellerFlow: React.FC<Props> = ({ account, switchToSplash }) => {
  const TRAVELLER_FLOW_DATA = [
    {
      title: "Welcome, Bridge Traveler.",
      Icon: Rotate,
      description:
        "Hello. We detect that you’ve traveled far from home. Welcome to Across.",
    },
    {
      title: "Our Offerings",
      Icon: Bolt,
      description: (
        <>
          Our realm offers lighting-fast transfers, astonishingly low fees and
          protection by{" "}
          <a
            href="https://umaproject.org/products/optimistic-oracle"
            target="_blank"
            rel="noreferrer"
          >
            UMA's Optimistic Oracle
          </a>
          . Learn more about Across <Link to="/about">here</Link>.
        </>
      ),
    },
    {
      title: "Reserve Your Gift",
      Icon: Present,
      description:
        "We’ve prepared a welcome gift for you! It awaits your arrival. Let us show you the way.",
    },
    {
      title: "Go Forth And Bridge",
      Icon: Heart,
      description:
        "This portal (button) will bring you to the bridge. You must complete a 0.1 ETH or 150 USDC transfer to receive your gift. Ready?",
    },
  ];

  const { step, setStep, history } = useTravellerFlow();
  const view = TRAVELLER_FLOW_DATA[step - 1];
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
