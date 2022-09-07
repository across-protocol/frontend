import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { Info } from "react-feather";
import { DialogContent, DialogOverlay } from "@reach/dialog";

import { formatWeiPct, getChainInfo } from "utils";
import { ButtonV2 } from "components/Buttons";

import { InputWithButton } from "./InputWithButton";
import { SpeedUpStats } from "./SpeedUpStats";
import {
  removePercentageSign,
  appendPercentageSign,
  feeInputToBigNumberPct,
} from "./utils";
import { useSpeedUp } from "../../hooks/useSpeedUp";

import { SupportedTxTuple } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  txTuple: SupportedTxTuple;
};

const maxRelayFee = "49.999%";

export function SpeedUpModal({ isOpen, onClose, txTuple }: Props) {
  const [token, transfer] = txTuple;

  const [relayFeeInput, setRelayFeeInput] = useState("");
  const [didSetInitialFee, setDidSetInitialFee] = useState(false);
  const [inputError, setInputError] = useState("");

  const {
    handleSpeedUp,
    speedUpStatus,
    isCorrectChain,
    setChain,
    suggestedRelayerFeePct,
    isFetchingFees,
  } = useSpeedUp(transfer, token);

  useEffect(() => {
    if (suggestedRelayerFeePct && !didSetInitialFee) {
      setDidSetInitialFee(true);
      setRelayFeeInput(
        appendPercentageSign(formatWeiPct(suggestedRelayerFeePct))
      );
    }
  }, [suggestedRelayerFeePct, didSetInitialFee]);

  const handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget.value;
    setRelayFeeInput(input);

    try {
      validateFeeInput(input, {
        maxFeeInput: Number(removePercentageSign(maxRelayFee)),
        minFeeInput: 0.001,
        maxDecimals: 3,
      });
      setInputError("");
    } catch (error) {
      setInputError((error as Error).message);
    }
  };

  const isRelayerFeeFairlyPriced = suggestedRelayerFeePct
    ? transfer.currentRelayerFeePct.gte(suggestedRelayerFeePct)
    : false;
  const isSpeedUpPending = speedUpStatus === "pending";
  const isConfirmDisabled =
    !relayFeeInput || !!inputError || isSpeedUpPending || !isCorrectChain;

  return (
    <Overlay isOpen={isOpen} onDismiss={onClose}>
      <Content aria-label="speed-up-modal">
        <Title>Speed up transaction</Title>
        {isCorrectChain ? (
          isRelayerFeeFairlyPriced && (
            <InfoBox>
              <div>
                <Info />
              </div>
              <p>
                Note: The relay is already fairly priced compared to other
                transactions with similar characteristics.
              </p>
            </InfoBox>
          )
        ) : (
          <ErrorBox>
            <div>
              <Info />
            </div>
            <p>
              You are on an incorrect network. Please{" "}
              <button
                onClick={() =>
                  setChain({
                    chainId: `0x${transfer.sourceChainId.toString(16)}`,
                  })
                }
              >
                switch to {getChainInfo(transfer.sourceChainId).name}
              </button>
            </p>
          </ErrorBox>
        )}
        <InputWithButton
          label="Relay fee"
          Button={
            <button onClick={() => setRelayFeeInput(maxRelayFee)}>MAX</button>
          }
          value={relayFeeInput}
          onChange={handleInputChange}
          onFocus={() => setRelayFeeInput((prev) => removePercentageSign(prev))}
          onBlur={() => setRelayFeeInput((prev) => appendPercentageSign(prev))}
          error={inputError}
          disabled={isFetchingFees}
        />
        <SpeedUpStats
          transferTokenTuple={txTuple}
          inputError={inputError}
          feeInput={relayFeeInput}
        />
        <ButtonsRow>
          <CancelButton size="md" onClick={onClose}>
            Cancel
          </CancelButton>
          <ConfirmButton
            size="md"
            disabled={isConfirmDisabled}
            warning={isRelayerFeeFairlyPriced}
            onClick={() => handleSpeedUp(feeInputToBigNumberPct(relayFeeInput))}
          >
            {isSpeedUpPending ? "Confirming..." : "Confirm"}
          </ConfirmButton>
        </ButtonsRow>
      </Content>
    </Overlay>
  );
}

function validateFeeInput(
  input: string,
  opts: {
    maxFeeInput: number;
    minFeeInput: number;
    maxDecimals: number;
  }
) {
  const cleanedInput = removePercentageSign(input);
  const inputNum = Number(cleanedInput);
  if (isNaN(inputNum)) {
    throw new Error("Invalid number");
  }

  if (inputNum > opts.maxFeeInput || inputNum <= opts.minFeeInput) {
    throw new Error(
      `Fee must be between ${opts.minFeeInput}% and ${opts.maxFeeInput}%`
    );
  }

  if (
    cleanedInput.includes(".") &&
    cleanedInput.split(".")[1].length > opts.maxDecimals
  ) {
    throw new Error(`Max. ${opts.maxDecimals} decimals allowed`);
  }
}

const Overlay = styled(DialogOverlay)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100000;
`;

const Content = styled(DialogContent)`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background-color: #202024;
  border: 1px solid #34353b;
  border-radius: 16px;
  width: 482px;
`;

const Title = styled.h1`
  font-size: ${22 / 16}rem;
  line-height: ${26 / 16}rem;
  font-weight: 400;
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px;
  background-color: rgba(249, 210, 108, 0.05);
  border: 1px solid rgba(249, 210, 108, 0.15);
  border-radius: 12px;

  svg {
    height: 24px;
    width: 24px;
    stroke: #f9d26c;
    margin-right: 14px;
  }

  p {
    font-size: ${16 / 16}rem;
    line-height: ${20 / 16}rem;
    font-weight: 400;
    color: #f9d26c;
  }
`;

const ErrorBox = styled(InfoBox)`
  background-color: #f96c6c25;
  border: 1px solid #f96c6c5a;

  button {
    background-color: inherit;
    font-size: inherit;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
  }

  svg {
    stroke: #f96c6c;
  }

  p {
    color: #f96c6c;
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
`;

const ConfirmButton = styled(ButtonV2)<{ warning?: boolean }>`
  border: 1px solid ${({ warning }) => (warning ? "#F9D26C" : "#6cf9d8")};
  border-radius: 20px;
  background-color: transparent;
  color: ${({ warning }) => (warning ? "#F9D26C" : "#6cf9d8")};
`;

const CancelButton = styled(ButtonV2)`
  background-color: transparent;
  color: #9daab2;
  border: none;
  :active {
    ::after {
      border: none;
    }
  }
`;
