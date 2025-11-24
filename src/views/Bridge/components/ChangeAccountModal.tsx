import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { isAddress as isSvmAddress } from "@solana/kit";

import { Modal, Text } from "components";
import { PrimaryButton, UnstyledButton } from "components/Button";
import { Input, InputGroup } from "components/Input";
import { ReactComponent as CrossIcon } from "assets/icons/cross.svg";
import { ampli } from "ampli";
import { useAmplitude } from "hooks";
import { useDisallowList } from "hooks/useDisallowList";

type ChangeAccountModalProps = {
  displayModal: boolean;
  onCloseModal: () => void;
  currentAccountEVM?: string;
  currentAccountSVM?: string;
  onChangeAccountEVM: (account: string) => void;
  onChangeAccountSVM: (account: string) => void;
  destinationChainEcosystem: "evm" | "svm";
};

const ChangeAccountModal = ({
  displayModal,
  onCloseModal,
  currentAccountEVM,
  currentAccountSVM,
  onChangeAccountEVM,
  onChangeAccountSVM,
  destinationChainEcosystem,
}: ChangeAccountModalProps) => {
  const [userInput, setUserInput] = useState(
    destinationChainEcosystem === "evm"
      ? currentAccountEVM || ""
      : currentAccountSVM || ""
  );
  const [validInput, setValidInput] = useState(false);

  const { isBlocked, isLoading } = useDisallowList(userInput);

  const { addToAmpliQueue } = useAmplitude();

  useEffect(() => {
    if (displayModal) {
      setUserInput(
        destinationChainEcosystem === "evm"
          ? currentAccountEVM || ""
          : currentAccountSVM || ""
      );
    }
  }, [
    currentAccountEVM,
    currentAccountSVM,
    displayModal,
    destinationChainEcosystem,
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isValidAddressEVM = ethers.utils.isAddress(userInput) && !isBlocked;
    const isValidAddressSVM = isSvmAddress(userInput) && !isBlocked;

    setValidInput(
      destinationChainEcosystem === "evm"
        ? isValidAddressEVM
        : isValidAddressSVM
    );
  }, [
    currentAccountEVM,
    currentAccountSVM,
    userInput,
    isBlocked,
    isLoading,
    destinationChainEcosystem,
  ]);

  const handleClickSave = () => {
    if (validInput || userInput === "") {
      if (destinationChainEcosystem === "evm") {
        onChangeAccountEVM(userInput);
      } else {
        onChangeAccountSVM(userInput);
      }
      addToAmpliQueue(() => {
        ampli.toAccountChanged({
          toWalletAddress: userInput,
        });
      });
      onCloseModal();
    }
  };

  const handleClickClear = () => {
    setUserInput("");
  };

  const handleClickCancel = () => {
    onCloseModal();
  };

  const validationLevel = !validInput && !!userInput ? "error" : "valid";

  return (
    <Modal
      title="Send to"
      exitModalHandler={handleClickCancel}
      isOpen={displayModal}
      width={550}
      height={900}
      exitOnOutsideClick
    >
      <Wrapper>
        <InnerWrapper>
          <InputGroup validationLevel={validationLevel}>
            <Input
              validationLevel={validationLevel}
              value={userInput}
              onChange={(t) => setUserInput(t.target.value)}
            />
            <CrossIconWrapper onClick={handleClickClear}>
              <StyledCrossIcon />
            </CrossIconWrapper>
          </InputGroup>
          <ButtonWrapper>
            <CancelButton onClick={handleClickCancel}>
              <Text size="lg" weight={500}>
                Cancel
              </Text>
            </CancelButton>
            <SaveButton
              disabled={!validInput && !!userInput}
              onClick={handleClickSave}
            >
              <Text size="lg" weight={500} color="dark-grey">
                Save
              </Text>
            </SaveButton>
          </ButtonWrapper>
        </InnerWrapper>
        <Text size="md" color="grey-400">
          Note that only{" "}
          <UnderlinedText>
            {destinationChainEcosystem === "evm" ? "Ethereum" : "Solana"}
          </UnderlinedText>{" "}
          addresses are valid.
        </Text>
      </Wrapper>
    </Modal>
  );
};

export default ChangeAccountModal;

const InnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 24px;
  width: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: flex-start;
  align-items: center;

  width: 100%;
`;

const CrossIconWrapper = styled.div`
  width: 24px;
  height: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledCrossIcon = styled(CrossIcon)`
  & svg * {
    stroke: black;
  }
  height: 16px;
  width: 16px;
  flex-shrink: 0;
`;

const UnderlinedText = styled.span`
  text-decoration: underline;
  color: #e0f3ff;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
  width: 100%;
`;

const CancelButton = styled(UnstyledButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 64px;

  border: 1px solid #9daab3;
  border-radius: 12px;
  background: transparent;

  cursor: pointer;

  &:hover {
    color: #e0f3ff;
    border-color: #e0f3ff;
  }
`;

const SaveButton = styled(PrimaryButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  width: 100%;
`;
