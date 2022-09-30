import styled from "@emotion/styled";
import { Alert, ButtonV2, Modal } from "components";
import { useEffect, useState } from "react";
import { ReactComponent as CheckmarkIcon } from "assets/icons/rounded-checkmark-16.svg";
import { QUERIESV2, shortenAddress } from "utils";
import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import { getCode, noContractCode } from "utils";
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
  const [isConfirmed, setIsConfirmed] = useState<
    "success" | "failure" | undefined
  >(undefined);
  const [isContractAddress, setIsContractAddress] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { isMobile } = useCurrentBreakpoint();

  useEffect(() => {
    if (!displayModal) {
      setIsConfirmed(undefined);
    }
  }, [displayModal]);

  useEffect(() => {
    if (address) {
      getCode(address, 1).then((addr) => {
        if (addr !== noContractCode) {
          setIsContractAddress(true);
        } else {
          setIsContractAddress(false);
        }
      });
    }
  }, [address]);

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
            setIsConfirmed(success ? "success" : "failure");
          })
          .finally(() => {
            setIsLoading(false);
          });
      },
      infoText:
        "By linking this wallet you approve it to be the recipient of the Across Community member airdrop.",
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
      verticalLocation={{
        tablet: "bottom",
        mobile: "bottom",
      }}
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
              {!isMobile
                ? currentFlow.address
                : shortenAddress(currentFlow.address, "...", 10)}
            </UserAddressInput>
          )}
          {isContractAddress ? (
            "Wallet is a contract address and Discord connection is not currently supported."
          ) : currentFlow.displaySuccess ? (
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

  @media ${QUERIESV2.tb.andDown} {
    font-size: 16px;
    line-height: 20px;
  }
`;

const StyledLinkButton = styled(ButtonV2)`
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;

  text-transform: capitalize;

  @media ${QUERIESV2.tb.andDown} {
    height: 40px;
    font-size: 14px;
    line-height: 18px;
  }
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

  @media ${QUERIESV2.tb.andDown} {
    height: 40px;
    font-size: 14px;
    line-height: 18px;
  }
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

  & svg {
    @media ${QUERIESV2.tb.andDown} {
      height: 14px;
      width: 14px;
    }
  }

  @media ${QUERIESV2.tb.andDown} {
    font-size: 14px;
    line-height: 18px;
  }
`;

const StyledCheckmark = styled(CheckmarkIcon)``;
