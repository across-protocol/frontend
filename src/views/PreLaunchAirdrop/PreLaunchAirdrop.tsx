import Footer from "components/Footer";
import {
  BackgroundLayer,
  ContentWrapper,
  OpacityLayer,
  Wrapper,
} from "./PreLaunchAirdrop.styles";
import VideoBackground from "assets/prelaunch/acx-bg-video-comp.mp4";
import usePreLaunchAirdrop from "./hooks/usePreLaunchAirdrop";
import TravellerFlow from "./components/TravellerFlow";
import { SplashFlow } from "./components/SplashFlow";
import { MoreInfoFlow } from "./components/MoreInfoFlow";
const PreLaunchAirdrop = () => {
  const {
    activePageFlow,
    setActivePageFlow,
    switchToSplash,
    switchToInfo,
    isConnected,
    connectWalletHandler,
    account,
    linkWalletHandler,
    discordLoginHandler,
    discordLogoutHandler,
    isDiscordAuthenticated,
    rewardsData,
    discordAvatar,
    discordId,
    discordName,
    linkedWallet,
    discordDetailsError,
  } = usePreLaunchAirdrop();
  let activePageComponent: JSX.Element;
  switch (activePageFlow) {
    case "traveller":
      activePageComponent = (
        <TravellerFlow
          account={account || ""}
          switchToSplash={switchToSplash}
        />
      );
      break;
    case "splash":
      activePageComponent = (
        <SplashFlow
          discordDetailsError={discordDetailsError}
          isDiscordAuthenticated={isDiscordAuthenticated}
          discordLoginHandler={discordLoginHandler}
          discordLogoutHandler={discordLogoutHandler}
          connectWalletHandler={connectWalletHandler}
          linkWalletHandler={linkWalletHandler}
          isConnected={isConnected}
          airdropDetailsLinkHandler={switchToInfo}
          account={account}
          rewardsData={rewardsData}
          discordAvatar={discordAvatar}
          discordId={discordId}
          discordName={discordName}
          linkedWallet={linkedWallet}
          setActivePageFlow={setActivePageFlow}
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

export default PreLaunchAirdrop;
