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
    refreshPage,
    switchToInfo,
    connectWallet,

    airdropRecipientQuery,
    maxApyPct,
    currentApyPct,
    claimAndStakeMutation,
    isAirdropClaimedQuery,
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
      activePageComponent = <MoreInfoFlow onClickBack={refreshPage} />;
      break;
    case "eligible":
      activePageComponent = (
        <EligibleWalletFlow
          isLoadingClaimed={isAirdropClaimedQuery.isLoading}
          isLoadingAirdrop={airdropRecipientQuery.isLoading}
          isClaiming={claimAndStakeMutation.isLoading}
          hasClaimed={isAirdropClaimedQuery.data}
          discord={airdropRecipientQuery.data?.discord}
          amount={airdropRecipientQuery.data?.amount}
          amountBreakdown={airdropRecipientQuery.data?.payload?.amountBreakdown}
          onClickClaim={claimAndStakeMutation.mutate}
          maxApyPct={maxApyPct}
          currentApyPct={currentApyPct}
          onClickInfoLink={switchToInfo}
        />
      );
      break;
    case "ineligible":
      activePageComponent = (
        <NotEligibleWalletFlow
          maxApyPct={maxApyPct}
          onClickInfoLink={switchToInfo}
        />
      );
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
