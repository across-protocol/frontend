import { useHotkeys } from "react-hotkeys-hook";
import styled from "@emotion/styled";

import { Modal, Text } from "components";
import { PrimaryButton } from "components/Button";
import { CHAIN_IDs, COLORS, shortenAddress } from "utils";
import { useEnrichedCrosschainBalances } from "hooks/useEnrichedCrosschainBalances";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { PolymarketProfile } from "./useHasPolymarketAccount";

import { ModalWrapper, ButtonWrapper } from "./PolymarketBanner.styles";

interface PolymarketAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PolymarketProfile;
}

export function PolymarketAddressModal({
  isOpen,
  onClose,
  profile,
}: PolymarketAddressModalProps) {
  const { setDestinationToken, setCustomDestinationAccount } =
    useQuoteRequestContext();
  const routeData = useEnrichedCrosschainBalances();

  const handleConfirm = () => {
    const polygonUsdc = routeData[CHAIN_IDs.POLYGON]?.find(
      (token) => token.symbol.toUpperCase() === "USDC"
    );

    if (polygonUsdc) {
      setDestinationToken(polygonUsdc);
    }

    setCustomDestinationAccount({
      accountType: "evm",
      address: profile.proxyWallet,
    });

    onClose();
  };

  useHotkeys("esc", () => onClose(), { enableOnFormTags: true });

  const createdDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasCustomName =
    profile.name && !profile.name.toLowerCase().startsWith("0x");

  return (
    <Modal
      title="Polymarket Account"
      exitModalHandler={onClose}
      verticalLocation="middle"
      isOpen={isOpen}
      width={480}
      exitOnOutsideClick
      titleBorder
    >
      <ModalWrapper>
        <ProfileSection>
          {hasCustomName && (
            <ProfileRow>
              <ProfileLabel>Account Name</ProfileLabel>
              <ProfileValue>{profile.name}</ProfileValue>
            </ProfileRow>
          )}
          <ProfileRow>
            <ProfileLabel>Deposit Address</ProfileLabel>
            <ProfileValue>
              {shortenAddress(profile.proxyWallet, "...", 6)}
            </ProfileValue>
          </ProfileRow>
          <ProfileRow>
            <ProfileLabel>Account Created</ProfileLabel>
            <ProfileValue>{createdDate}</ProfileValue>
          </ProfileRow>
        </ProfileSection>

        <InfoText>
          Confirming will set your destination to Polygon USDC with your
          Polymarket deposit address as the recipient.
        </InfoText>

        <ButtonWrapper>
          <ConfirmButton onClick={handleConfirm}>
            <Text size="lg" weight={500} color="dark-grey">
              Confirm
            </Text>
          </ConfirmButton>
        </ButtonWrapper>
      </ModalWrapper>
    </Modal>
  );
}

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 16px;
  background: ${COLORS["black-700"]};
  border-radius: 12px;
`;

const ProfileRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProfileLabel = styled.span`
  font-size: 14px;
  color: ${COLORS["grey-400"]};
`;

const ProfileValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${COLORS["white-100"]};
`;

const InfoText = styled.p`
  font-size: 14px;
  color: ${COLORS["grey-400"]};
  line-height: 1.5;
  margin: 0;
`;

const ConfirmButton = styled(PrimaryButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
`;
