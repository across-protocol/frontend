import styled from "@emotion/styled";
import Footer from "components/Footer";
import {
  BackgroundLayer,
  ContentWrapper,
  OpacityLayer,
  Wrapper,
} from "./PreLaunchAirdrop.styles";
import VideoBackground from "assets/prelaunch/acx-bg-video-comp.mp4";
import usePreLaunchAirdrop from "./usePreLaunchAirdrop";
import TravellerFlow from "./components/TravellerFlow";
import { SplashFlow } from "./components/SplashFlow";
import { EligibilityFlow } from "./components/EligibilityFlow";

const PreLaunchAirdrop = () => {
  const { activePageFlow, switchToEligibility } = usePreLaunchAirdrop();

  let activePageComponent: JSX.Element;
  switch (activePageFlow) {
    case "eligibility":
      activePageComponent = <EligibilityFlow />;
      break;
    case "traveller":
      activePageComponent = <TravellerFlow />;
      break;
    case "splash":
      activePageComponent = (
        <SplashFlow eligibilityLinkHandler={switchToEligibility} />
      );
      break;
    default:
      activePageComponent = <></>;
  }

  return (
    <Wrapper>
      <BackgroundLayer autoPlay loop muted>
        <source src={VideoBackground} type="video/mp4" />
      </BackgroundLayer>
      <OpacityLayer />
      <ContentWrapper>{activePageComponent}</ContentWrapper>
      <Footer />
    </Wrapper>
  );
};

const TestIcon = styled(IIcon)`
  height: 200px;
  width: 200px;
`;
const TestDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 64px;
  padding: 64px 0;
`;

export default PreLaunchAirdrop;
