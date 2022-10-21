import Footer from "components/Footer";
import VideoBackground from "assets/prelaunch/acx-bg-video-comp.mp4";

import { SplashFlow } from "./components/SplashFlow";
import { MoreInfoFlow } from "./components/MoreInfoFlow";
import { EligibleWalletFlow } from "./components/EligibleWalletFlow";
import { NotEligibleWalletFlow } from "./components/NotEligibleWalletFlow";

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
    handleAddTokenToWallet,
    airdropRecipientQuery,
    merkleDistributor,
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
    case "eligible":
      activePageComponent = (
        <EligibleWalletFlow
          isLoadingClaimed={merkleDistributor.isLoadingClaimed}
          isLoadingAirdrop={airdropRecipientQuery.isLoading}
          isClaiming={merkleDistributor.isClaiming}
          hasClaimed={merkleDistributor.isClaimed}
          discord={airdropRecipientQuery.data?.discord}
          amount={airdropRecipientQuery.data?.amount}
          amountBreakdown={airdropRecipientQuery.data?.payload?.amountBreakdown}
          onClickAddToken={handleAddTokenToWallet}
          onClickClaim={merkleDistributor.handleClaim}
          errorMsg={merkleDistributor.errorMsg}
        />
      );
      break;
    case "ineligible":
      activePageComponent = <NotEligibleWalletFlow />;
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
