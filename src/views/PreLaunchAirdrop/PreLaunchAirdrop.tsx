import Footer from "components/Footer";
import {
  BackgroundLayer,
  ContentWrapper,
  Wrapper,
} from "./PreLaunchAirdrop.styles";
import usePreLaunchAirdrop from "./usePreLaunchAirdrop";
import TravellerFlow from "./components/TravellerFlow";
import { SplashFlow } from "./components/SplashFlow";
import { EligibilityFlow } from "./components/EligibilityFlow";

const PreLaunchAirdrop = () => {
  const { activePageFlow } = usePreLaunchAirdrop();

  let activePageComponent: JSX.Element;
  switch (activePageFlow) {
    case "eligibility":
      activePageComponent = <EligibilityFlow />;
      break;
    case "traveller":
      activePageComponent = <TravellerFlow />;
      break;
    case "splash":
      activePageComponent = <SplashFlow />;
      break;
    default:
      activePageComponent = <></>;
  }

  return (
    <Wrapper>
      <BackgroundLayer />
      <ContentWrapper>{activePageComponent}</ContentWrapper>
      <Footer />
    </Wrapper>
  );
};

export default PreLaunchAirdrop;
