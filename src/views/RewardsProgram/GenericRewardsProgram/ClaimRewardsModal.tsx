import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Alert, Modal } from "components";
import { SecondaryButton } from "components/Button";
import { Text } from "components/Text";
import { formatEther, QUERIESV2, rewardProgramTypes, rewardTiers } from "utils";

import { useClaimModal } from "../hooks/useClaimModal";

type Props = {
  isOpen: boolean;
  onExit: () => void;
  program: rewardProgramTypes;
};

export function ClaimRewardsModal({ isOpen, onExit, program }: Props) {
  const {
    importTokenHandler,
    unclaimedReferralProofsQuery,
    claimMutation,
    token,
  } = useClaimModal(program);

  const disableButton =
    unclaimedReferralProofsQuery.isLoading ||
    BigNumber.from(
      unclaimedReferralProofsQuery.data?.claimableAmount ?? 0
    ).isZero() ||
    claimMutation.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      title="Referral rewards"
      exitModalHandler={onExit}
      width={550}
      height={400}
      exitOnOutsideClick
      disableExitOverride={false}
      verticalLocation={{
        tablet: "bottom",
        mobile: "bottom",
      }}
    >
      <Alert status="warn">
        Claiming your ACX will reset your tier to Copper and referral rate to{" "}
        {rewardTiers[0].referralRate * 100}%.
      </Alert>
      <ClaimableBoxInnerWrapper>
        <ClaimableBox>
          <Text size="lg" color="white-70">
            Claimable rewards
          </Text>
          <Text color="white-100">
            {unclaimedReferralProofsQuery.isLoading ? (
              "Loading..."
            ) : (
              <IconText>
                {formatEther(
                  unclaimedReferralProofsQuery.data?.claimableAmount || "0"
                ) + " ACX"}
                <Icon src={token.logoURI} />
              </IconText>
            )}
          </Text>
        </ClaimableBox>
        <Button
          size="lg"
          borderColor="yellow"
          onClick={() =>
            claimMutation.mutate(undefined, { onSuccess: () => onExit() })
          }
          disabled={disableButton}
        >
          {claimMutation.isLoading ? "Claiming..." : "Claim rewards"}
        </Button>
      </ClaimableBoxInnerWrapper>
      <AddToWalletWrapper>
        <Text size="md" color="white-70">
          Can't find the ACX token in your wallet? &nbsp;
        </Text>
        <AddToWalletLink onClick={importTokenHandler}>
          Click here to add it.
        </AddToWalletLink>
      </AddToWalletWrapper>
    </Modal>
  );
}

const ClaimableBox = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border: 1px solid #3e4047;
  border-radius: 12px;
`;

const ClaimableBoxInnerWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
`;

const Button = styled(SecondaryButton)`
  width: 100%;
`;

const AddToWalletWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: center;
  align-items: center;
  justify-content: center;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    gap: 8px;
  }
`;

const AddToWalletLink = styled(Text)`
  cursor: pointer;
`;

const Icon = styled.img`
  height: 16px;
  width: 16px;
`;

const IconText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
