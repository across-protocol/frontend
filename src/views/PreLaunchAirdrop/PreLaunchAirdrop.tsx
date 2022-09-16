import Footer from "components/Footer";

import {
  BackgroundLayer,
  ContentWrapper,
  Wrapper,
} from "./PreLaunchAirdrop.styles";
import usePreLaunchAirdrop, { FlowSelector } from "./usePreLaunchAirdrop";
import TravellerFlow from "./components/TravellerFlow";
import { SplashFlow } from "./components/SplashFlow";
import { EligibilityFlow } from "./components/EligibilityFlow";
const PreLaunchAirdrop = () => {
  const { activePageFlow } = usePreLaunchAirdrop();

  const pageFlowOptions: Record<FlowSelector, JSX.Element> = {
    eligibility: <EligibilityFlow />,
    traveller: <TravellerFlow />,
    splash: <SplashFlow />,
  };

  return (
    <Wrapper>
      <BackgroundLayer />
      <ContentWrapper>{pageFlowOptions[activePageFlow]}</ContentWrapper>
      <Footer />
    </Wrapper>
  );
};

export default PreLaunchAirdrop;
