import styled from "@emotion/styled";
import { Modal, Text } from "components";
import { useEffect, useState } from "react";
import { QUERIESV2 } from "utils";
import { ReactComponent as CrossIcon } from "assets/icons/cross-16.svg";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";
import { ethers } from "ethers";
import { ampli } from "ampli";

type ChangeAccountModalProps = {
  displayModal: boolean;
  displayModalCloseHandler: () => void;
  currentAccount: string;
  changeAccountHandler: (account: string) => void;
};

const ChangeAccountModal = ({
  displayModal,
  displayModalCloseHandler,
  currentAccount,
  changeAccountHandler,
}: ChangeAccountModalProps) => {
  const [userInput, setUserInput] = useState(currentAccount);
  const [validInput, setValidInput] = useState(false);

  useEffect(() => {
    if (displayModal) {
      setUserInput(currentAccount);
    }
  }, [currentAccount, displayModal]);

  useEffect(() => {
    setValidInput(
      ethers.utils.isAddress(userInput) && userInput !== currentAccount
    );
  }, [currentAccount, userInput]);

  const onSaveHandler = () => {
    if (validInput) {
      changeAccountHandler(userInput);
      ampli.toAccountChanged({
        toWalletAddress: userInput,
      });
      displayModalCloseHandler();
    }
  };

  const onClearHandler = () => {
    setUserInput("");
  };

  const onCancelHandler = () => {
    displayModalCloseHandler();
  };

  return (
    <Modal
      title="Send to"
      exitModalHandler={displayModalCloseHandler}
      isOpen={displayModal}
      width={550}
      height={900}
      exitOnOutsideClick
    >
      <Wrapper>
        <InnerWrapper>
          <InputWrapper>
            <AmountInnerInput
              value={userInput}
              onChange={(t) => setUserInput(t.target.value)}
            />
            <CrossIconWrapper onClick={onClearHandler}>
              <StyledCrossIcon />
            </CrossIconWrapper>
          </InputWrapper>
          <ButtonWrapper>
            <CancelButton onClick={onCancelHandler}>
              <Text size="lg" weight={500}>
                Cancel
              </Text>
            </CancelButton>
            <SaveButton disabled={!validInput} onClick={onSaveHandler}>
              <Text size="lg" weight={500} color="dark-grey">
                Save
              </Text>
            </SaveButton>
          </ButtonWrapper>
        </InnerWrapper>
        <Text size="md" color="grey-400">
          Note that only <UnderlinedText>Ethereum</UnderlinedText> addresses are
          valid.
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
  gap: 16px;
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

const InputWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 9px 24px;

  height: 64px;
  width: 100%;

  background: #202024;
  border: 1px solid #3e4047;
  border-radius: 36px;

  @media ${QUERIESV2.sm.andDown} {
    height: 48px;
    padding: 6px 12px 6px 24px;
  }

  @media ${QUERIESV2.xs.andDown} {
    width: 100%;
  }
`;

const AmountInnerInput = styled.input`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;

  color: "#e0f3ff";
  background: none;

  width: 100%;
  padding: 0;
  border: none;
  outline: 0;

  &:focus {
    outline: 0;
    font-size: 18px;
  }

  &::placeholder {
    color: #9daab3;
  }

  overflow-x: hidden;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 16px;
    line-height: 20px;
  }
`;

const CrossIconWrapper = styled.div`
  width: 24px;
  height: 24px;
  cursor: pointer;
  padding: 8px;
  background: #9daab3;
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
  border-radius: 32px;
  background: transparent;

  cursor: pointer;

  &:hover {
    color: #e0f3ff;
    border-color: #e0f3ff;
  }
`;

const SaveButton = styled(UnstyledButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 64px;

  border-radius: 32px;

  cursor: pointer;

  background-color: #6cf9d8;
`;
