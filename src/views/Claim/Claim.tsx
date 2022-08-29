import Footer from "components/Footer";

import { DisconnectedWallet } from "./components/DisconnectedWallet";
import { NotEligibleWallet } from "./components/NotEligibleWallet";
import { EligibleWallet } from "./components/EligibleWallet";
import { useClaimView } from "./hooks/useClaimView";

import { PageContainer, BodyContainer, Title } from "./Claim.styles";

export function Claim() {
  const {
    isConnected,
    airdropRecipientQuery,
    handleClaim,
    handleConnectWallet,
    handleAddTokenToWallet,
    hasClaimedState,
    claimState,
  } = useClaimView();

  const isEligible =
    !airdropRecipientQuery.isLoading && airdropRecipientQuery.data;

  return (
    <PageContainer>
      <BodyContainer>
        <Title>Airdrop</Title>
        {!isConnected || airdropRecipientQuery.isLoading ? (
          <DisconnectedWallet
            onClickConnect={handleConnectWallet}
            isCheckingEligibility={airdropRecipientQuery.isLoading}
          />
        ) : !isEligible ? (
          <NotEligibleWallet />
        ) : (
          <EligibleWallet
            onClickClaim={handleClaim}
            amount={airdropRecipientQuery.data?.amount}
            amountBreakdown={
              airdropRecipientQuery.data?.metadata.amountBreakdown
            }
            isLoading={hasClaimedState.status === "pending"}
            hasClaimed={
              hasClaimedState.status === "success" && hasClaimedState.hasClaimed
            }
            onClickAddToken={handleAddTokenToWallet}
            isClaiming={claimState.status.includes("pending")}
          />
        )}
      </BodyContainer>
      <Footer />
    </PageContainer>
  );
}

export default Claim;
