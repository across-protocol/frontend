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
import { MoreInfoFlow } from "./components/MoreInfoFlow";
const PreLaunchAirdrop = () => {
  const { activePageFlow, switchToSplash, switchToInfo } =
    usePreLaunchAirdrop();

  let activePageComponent: JSX.Element;
  switch (activePageFlow) {
    case "traveller":
      activePageComponent = <TravellerFlow />;
      break;
    case "splash":
      activePageComponent = (
        <SplashFlow airdropDetailsLinkHandler={switchToInfo} />
      );
      break;
    case "info":
      activePageComponent = <MoreInfoFlow onClickBack={switchToSplash} />;
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

export default PreLaunchAirdrop;
