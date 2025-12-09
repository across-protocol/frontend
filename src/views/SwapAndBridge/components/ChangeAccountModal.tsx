import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { isAddress as isSvmAddress } from "@solana/kit";

import { Modal, Text } from "components";
import { PrimaryButton } from "components/Button";
import { Input, InputGroup } from "components/Input";
import { ReactComponent as CrossIcon } from "assets/icons/cross.svg";
import { ReactComponent as PencilIcon } from "assets/icons/pencil.svg";

import { ampli } from "ampli";
import { useAmplitude } from "hooks";
import { useDisallowList } from "hooks/useDisallowList";
import { COLORS, shortenAddress } from "utils";
import { useHotkeys } from "react-hotkeys-hook";
import { useQuoteRequestContext } from "../hooks/useQuoteRequest/QuoteRequestContext";
import { useEcosystemAccounts } from "../../../hooks/useEcosystemAccounts";

export const ChangeAccountModal = () => {
  const {
    quoteRequest,
    setCustomDestinationAccount,
    resetCustomDestinationAccount,
  } = useQuoteRequestContext();
  const { recipient, recipientOrPlaceholder, destinationEcosystem } =
    useEcosystemAccounts({
      originToken: quoteRequest.originToken,
      destinationToken: quoteRequest.destinationToken,
    });

  const currentRecipientAccount =
    quoteRequest.customDestinationAccount?.address ?? recipient;

  const inputRef = useRef<HTMLInputElement>(null);
  const [displayModal, setDisplayModal] = useState(false);
  const [userInput, setUserInput] = useState(currentRecipientAccount ?? "");
  const [validInput, setValidInput] = useState(false);

  const { isBlocked, isLoading } = useDisallowList(userInput ?? "");

  const { addToAmpliQueue } = useAmplitude();

  const onCloseModal = () => setDisplayModal(false);

  useEffect(() => {
    if (displayModal) {
      inputRef.current?.focus();
      setUserInput(currentRecipientAccount ?? "");
    }
  }, [displayModal, currentRecipientAccount]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isValidAddressEVM = ethers.utils.isAddress(userInput) && !isBlocked;
    const isValidAddressSVM = isSvmAddress(userInput) && !isBlocked;

    setValidInput(
      destinationEcosystem === "evm" ? isValidAddressEVM : isValidAddressSVM
    );
  }, [userInput, isBlocked, isLoading, destinationEcosystem]);

  const handleClickSave = () => {
    if (validInput || userInput === "") {
      if (userInput && userInput !== recipient) {
        setCustomDestinationAccount({
          accountType: destinationEcosystem,
          address: userInput,
        });
      } else {
        resetCustomDestinationAccount();
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

  useHotkeys("esc", () => onCloseModal(), { enableOnFormTags: true });

  return (
    <>
      <Trigger onClick={() => setDisplayModal(true)}>
        <>
          {currentRecipientAccount
            ? shortenAddress(currentRecipientAccount, "..", 4)
            : "Set Recipient"}
          <PencilIcon color="inherit" width="16px" height="16px" />
        </>
      </Trigger>

      <Modal
        title="Destination Address"
        exitModalHandler={handleClickCancel}
        verticalLocation="middle"
        isOpen={displayModal}
        width={480}
        exitOnOutsideClick
        titleBorder
      >
        <Wrapper>
          <RowSpaced>
            <SubHeading>Wallet Address</SubHeading>
            {userInput !== recipientOrPlaceholder && (
              <ResetButton onClick={() => setUserInput(recipientOrPlaceholder)}>
                Reset to Default
              </ResetButton>
            )}
          </RowSpaced>

          <InputGroup validationLevel={validationLevel}>
            <Input
              spellCheck={false}
              ref={inputRef}
              validationLevel={validationLevel}
              value={userInput}
              onChange={(t) => setUserInput(t.target.value)}
            />
            <CrossIconWrapper onClick={handleClickClear}>
              <StyledCrossIcon />
            </CrossIconWrapper>
          </InputGroup>
          <Warning>
            Note that only{" "}
            <BoldText>
              {destinationEcosystem === "evm" ? "Ethereum" : "Solana"}
            </BoldText>{" "}
            addresses are valid.
          </Warning>
          <ButtonWrapper>
            <SaveButton
              disabled={!validInput && !!userInput}
              onClick={handleClickSave}
            >
              <Text size="lg" weight={500} color="dark-grey">
                Save
              </Text>
            </SaveButton>
          </ButtonWrapper>
        </Wrapper>
      </Modal>
    </>
  );
};

const ResetButton = styled.button`
  font-size: 14px;
  color: ${COLORS.aqua};
  padding-block: 0;
`;

const RowSpaced = styled.div`
  width: 100%;
  height: 21px;
  display: flex;
  justify-content: space-between;
`;

const Trigger = styled.button`
  color: var(--base-bright-gray, #e0f3ff);

  /* Body/Small */
  font-family: Barlow, serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;

  display: inline-flex;
  align-items: center;
  gap: 4px;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`;

const SubHeading = styled.div`
  color: var(--shades-Neutrals-neutral-400, #869099);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%;
`;

const Warning = styled.span`
  color: var(--shades-Neutrals-neutral-400, #869099);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%;
  margin-top: 4px;
  margin-bottom: 12px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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

const BoldText = styled.span`
  font-weight: 500;
  color: #e0f3ff;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0;
  gap: 16px;
  width: 100%;
`;

const SaveButton = styled(PrimaryButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  width: 100%;
`;
