import Footer from "components/Footer";
import VideoBackground from "assets/prelaunch/acx-bg-video-comp.mp4";

import { SplashFlow } from "./components/SplashFlow";
import { MoreInfoFlow } from "./components/MoreInfoFlow";

import useAirdrop from "./hooks/useAirdrop";

import {
  BackgroundLayer,
  ContentWrapper,
  OpacityLayer,
  Wrapper,
} from "./Airdrop.styles";

const Airdrop = () => {
  const {
    activePageFlow,
    switchToInfo,
    switchToSplash,
    connectWallet,
    airdropRecipientQuery,
  } = useAirdrop();
  let activePageComponent: JSX.Element;
  switch (activePageFlow) {
    case "splash":
      activePageComponent = (
        <SplashFlow
          connectWalletHandler={connectWallet}
          isConnecting={airdropRecipientQuery.isLoading}
          airdropDetailsLinkHandler={switchToInfo}
        />
      );
      break;
    case "info":
      activePageComponent = <MoreInfoFlow onClickBack={switchToSplash} />;
      break;
    default:
      activePageComponent = <></>;
  }

  return (
    <>
      <Wrapper>
        <BackgroundLayer autoPlay loop muted>
          <source src={VideoBackground} type="video/mp4" />
        </BackgroundLayer>
        <OpacityLayer />

        <ContentWrapper>{activePageComponent}</ContentWrapper>
        <Footer />
      </Wrapper>
    </>
  );
};

export default Airdrop;
