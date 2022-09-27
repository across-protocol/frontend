import styled from "@emotion/styled";
import { Alert, ButtonV2, Modal } from "components";
import { useEffect, useState } from "react";
import { ReactComponent as CheckmarkIcon } from "assets/icons/rounded-checkmark-16.svg";

type LinkWalletModalType = {
  displayModal: boolean;
  exitModalHandler: () => void;

  linkWalletHandler: () => Promise<boolean>;

  isConnected: boolean;
  connectWalletHandler: () => void;
  address?: string;
};
const LinkWalletModal = ({
  displayModal,
  exitModalHandler,

  linkWalletHandler,

  isConnected,
  connectWalletHandler,
  address,
}: LinkWalletModalType) => {
  const [isConfirmed, setConfirmed] = useState<
    "success" | "failure" | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!displayModal) {
      setConfirmed(undefined);
    }
  }, [displayModal]);

  const walletFlow = {
    disconnected: {
      buttonText: "Connect wallet",
      buttonHandler: connectWalletHandler,

      infoText: "Connect to the wallet you wish to receive your airdrop to.",
      address: undefined,
      displaySuccess: false,
    },
    connectedNotLinked: {
      buttonText: "Link wallet",
      buttonHandler: () => {
        setIsLoading(true);
        linkWalletHandler()
          .then((success) => {
            setConfirmed(success ? "success" : "failure");
          })
          .finally(() => {
            setIsLoading(false);
          });
      },
      infoText:
        "By linking this wallet you approve it to be the recipient of the Bridge Traveler Program airdrop.",
      address,
      displaySuccess: false,
    },
    connectedLinked: {
      buttonText: "",
      buttonHandler: () => {},

      infoText:
        "To link a different wallet, connect to said wallet and reinitiate the same linking procedure previously performed.",
      address,
      displaySuccess: true,
    },
  };
  const currentFlow = isConfirmed
    ? walletFlow.connectedLinked
    : isConnected
    ? walletFlow.connectedNotLinked
    : walletFlow.disconnected;

  return displayModal ? (
    <Modal
      title="Link to Ethereum wallet"
      exitModalHandler={exitModalHandler}
      width={550}
      height={450}
      exitOnOutsideClick
      disableExitOverride={isLoading}
    >
      <Alert status="warn">
        The linked wallet can be changed up until the official token launch on
        the 12th of October.
      </Alert>
      <ButtonTextStack>
        <InfoText>{currentFlow.infoText}</InfoText>
        <ButtonStack>
          {currentFlow.address && (
            <UserAddressInput
              success={currentFlow.displaySuccess ? isConfirmed : undefined}
            >
              {currentFlow.address}
            </UserAddressInput>
          )}
          {currentFlow.displaySuccess ? (
            <ConfirmationTextWrapper success={isConfirmed === "success"}>
              {isConfirmed === "success" ? (
                <>
                  Wallet successfully linked <StyledCheckmark />
                </>
              ) : (
                "Wallet could not be linked. Please retry."
              )}
            </ConfirmationTextWrapper>
          ) : (
            <StyledLinkButton
              size="lg"
              disabled={isLoading}
              onClick={currentFlow.buttonHandler}
            >
              {isLoading ? "Linking..." : currentFlow.buttonText}
            </StyledLinkButton>
          )}
        </ButtonStack>
      </ButtonTextStack>
    </Modal>
  ) : null;
};

export default LinkWalletModal;

const ButtonTextStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  align-items: center;
  justify-content: center;

  width: 100%;
`;

const ButtonStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;

  width: 100%;
`;

const InfoText = styled.p`
  font-size: 18px;
  line-height: 26px;
  color: #9daab2;

  text-align: center;
`;

const StyledLinkButton = styled(ButtonV2)`
  width: 100%;

  text-transform: capitalize;
`;

const UserAddressInput = styled.div<{ success?: string }>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 9px 24px;
  gap: 255px;

  width: 100%;
  height: 64px;

  background-color: #2d2e33;

  border: 1px solid;
  border-radius: 32px;

  font-size: 18px;
  line-height: 26px;
  color: #9daab2;

  border-color: ${({ success }) =>
    success === "success"
      ? "#6CF9D8"
      : success === "failure"
      ? "#f96c6c"
      : "#3e4047"};
`;

const ConfirmationTextWrapper = styled.div<{ success: boolean }>`
  font-size: 16px;
  line-height: 20px;

  color: ${({ success }) => (success ? "#6cf9d8" : "#f96c6c")};

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  gap: 8px;

  width: 100%;

  & svg * {
    stroke: ${({ success }) => (success ? "#6cf9d8" : "#f96c6c")};
  }
`;

const StyledCheckmark = styled(CheckmarkIcon)``;
