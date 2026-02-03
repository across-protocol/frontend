import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { useHotkeys } from "react-hotkeys-hook";

import { Modal, Text } from "components";
import { PrimaryButton } from "components/Button";
import { Input, InputGroup } from "components/Input";
import { ReactComponent as CrossIcon } from "assets/icons/cross.svg";
import { useDisallowList } from "hooks/useDisallowList";
import { CHAIN_IDs } from "utils";
import { useEnrichedCrosschainBalances } from "hooks/useEnrichedCrosschainBalances";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";

import {
  ModalWrapper,
  ModalInstruction,
  ModalLink,
  ButtonWrapper,
} from "./PolymarketBanner.styles";
import styled from "@emotion/styled";

interface PolymarketAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAddress?: string | null;
}

export function PolymarketAddressModal({
  isOpen,
  onClose,
  defaultAddress,
}: PolymarketAddressModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [userInput, setUserInput] = useState("");
  const [validInput, setValidInput] = useState(false);

  const { isBlocked, isLoading } = useDisallowList(userInput ?? "");
  const { setDestinationToken, setCustomDestinationAccount } =
    useQuoteRequestContext();
  const routeData = useEnrichedCrosschainBalances();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setUserInput(defaultAddress ?? "");
    }
  }, [isOpen, defaultAddress]);

  useEffect(() => {
    if (isLoading) return;

    const isValidAddress = ethers.utils.isAddress(userInput) && !isBlocked;
    setValidInput(isValidAddress);
  }, [userInput, isBlocked, isLoading]);

  const handleConfirm = () => {
    if (!validInput) return;

    const polygonUsdc = routeData[CHAIN_IDs.POLYGON]?.find(
      (token) => token.symbol.toUpperCase() === "USDC"
    );

    if (polygonUsdc) {
      setDestinationToken(polygonUsdc);
    }

    setCustomDestinationAccount({
      accountType: "evm",
      address: userInput,
    });

    onClose();
  };

  const handleClear = () => {
    setUserInput("");
  };

  const validationLevel = !validInput && !!userInput ? "error" : "valid";

  useHotkeys("esc", () => onClose(), { enableOnFormTags: true });

  return (
    <Modal
      title="Polymarket Destination Address"
      exitModalHandler={onClose}
      verticalLocation="middle"
      isOpen={isOpen}
      width={480}
      exitOnOutsideClick
      titleBorder
    >
      <ModalWrapper>
        <ModalInstruction>
          You can find the address by clicking the User icon and short
          instruction{" "}
          <ModalLink
            href="https://polymarket.com/profile"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </ModalLink>{" "}
          to find correct address.
        </ModalInstruction>

        <InputGroup validationLevel={validationLevel}>
          <Input
            spellCheck={false}
            ref={inputRef}
            validationLevel={validationLevel}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="0x..."
          />
          {userInput && (
            <CrossIconWrapper onClick={handleClear}>
              <StyledCrossIcon />
            </CrossIconWrapper>
          )}
        </InputGroup>

        <ButtonWrapper>
          <ConfirmButton disabled={!validInput} onClick={handleConfirm}>
            <Text size="lg" weight={500} color="dark-grey">
              Confirm address
            </Text>
          </ConfirmButton>
        </ButtonWrapper>
      </ModalWrapper>
    </Modal>
  );
}

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

const ConfirmButton = styled(PrimaryButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
`;
