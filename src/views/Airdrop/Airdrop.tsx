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
    maxApyPct,
    currentApyPct,
    claimMutation,
    isClaimedQuery,
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
          isLoadingClaimed={isClaimedQuery.isLoading}
          isLoadingAirdrop={airdropRecipientQuery.isLoading}
          isClaiming={claimMutation.isLoading}
          hasClaimed={isClaimedQuery.data}
          discord={airdropRecipientQuery.data?.discord}
          amount={airdropRecipientQuery.data?.amount}
          amountBreakdown={airdropRecipientQuery.data?.payload?.amountBreakdown}
          onClickAddToken={handleAddTokenToWallet}
          onClickClaim={claimMutation.mutate}
          errorMsg={
            claimMutation.error ? (claimMutation.error as Error).message : ""
          }
          maxApyPct={maxApyPct}
          currentApyPct={currentApyPct}
        />
      );
      break;
    case "ineligible":
      activePageComponent = <NotEligibleWalletFlow maxApyPct={maxApyPct} />;
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
