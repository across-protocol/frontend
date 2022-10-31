import React, { useState, useEffect } from "react";
import { Info, Zap } from "react-feather";

import { formatWeiPct, getChainInfo } from "utils";
import { maxRelayFee, minRelayFee } from "utils/constants";

import {
  Overlay,
  Content,
  SuccessContainer,
  SpeedUpTxLinkContainer,
  Title,
  InfoBox,
  ErrorBox,
  ButtonsRow,
  CancelButton,
  ConfirmButton,
} from "./SpeedUpModal.styles";
import { InputWithButton } from "./InputWithButton";
import { SpeedUpStats } from "./SpeedUpStats";
import {
  removePercentageSign,
  appendPercentageSign,
  feeInputToBigNumberPct,
  validateFeeInput,
} from "./utils";
import { useSpeedUp } from "../../hooks/useSpeedUp";

import { SupportedTxTuple } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  txTuple: SupportedTxTuple;
};

export function SpeedUpModal({ isOpen, onClose, txTuple }: Props) {
  const [token, transfer] = txTuple;

  const [relayFeeInput, setRelayFeeInput] = useState("");
  const [didSetInitialFee, setDidSetInitialFee] = useState(false);
  const [inputError, setInputError] = useState("");

  const {
    speedUp,
    speedUpStatus,
    speedUpErrorMsg,
    isCorrectChain,
    setChain,
    suggestedRelayerFeePct,
    isFetchingFees,
    speedUpTxLink,
  } = useSpeedUp(transfer, token);

  useEffect(() => {
    if (suggestedRelayerFeePct && !didSetInitialFee) {
      setDidSetInitialFee(true);
      setRelayFeeInput(
        appendPercentageSign(formatWeiPct(suggestedRelayerFeePct) || "0")
      );
    }
  }, [suggestedRelayerFeePct, didSetInitialFee]);

  useEffect(() => {
    try {
      if (relayFeeInput) {
        const currentFeePct =
          Number(formatWeiPct(transfer.currentRelayerFeePct, 3)) / 100;
        validateFeeInput(relayFeeInput, {
          maxFeePct: maxRelayFee,
          minFeePct: Math.max(minRelayFee, currentFeePct),
          maxDecimals: 3,
        });
        setInputError("");
      }
    } catch (error) {
      setInputError((error as Error).message);
    }
  }, [relayFeeInput, transfer.currentRelayerFeePct]);

  const handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget.value;
    setRelayFeeInput(input);
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
        {speedUpStatus === "success" ? (
          <SuccessContent onClose={onClose} />
        ) : (
          <>
            <Title>Speed up transaction</Title>
            <AlertBox
              isCorrectChain={isCorrectChain}
              speedUpError={speedUpErrorMsg}
              isRelayerFeeFairlyPriced={isRelayerFeeFairlyPriced}
              sourceChainId={transfer.sourceChainId}
              onClickSwitch={() =>
                setChain({
                  chainId: `0x${transfer.sourceChainId.toString(16)}`,
                })
              }
            />
            <InputWithButton
              label="Relay fee"
              value={relayFeeInput}
              onChange={handleInputChange}
              onFocus={() =>
                setRelayFeeInput((prev) => removePercentageSign(prev))
              }
              onBlur={() =>
                setRelayFeeInput((prev) => appendPercentageSign(prev))
              }
              error={inputError}
              disabled={isFetchingFees}
            />
            <SpeedUpStats
              transferTokenTuple={txTuple}
              inputError={inputError}
              feeInput={relayFeeInput}
              isInitiallyFetchingFees={isFetchingFees && !didSetInitialFee}
            />
            <ButtonsRow>
              <CancelButton size="md" onClick={onClose}>
                Cancel
              </CancelButton>
              <ConfirmButton
                size="md"
                disabled={isConfirmDisabled}
                warning={isRelayerFeeFairlyPriced}
                onClick={() => speedUp(feeInputToBigNumberPct(relayFeeInput))}
              >
                {isSpeedUpPending ? "Confirming..." : "Confirm"}
              </ConfirmButton>
            </ButtonsRow>
          </>
        )}
        {speedUpTxLink && (
          <SpeedUpTxLinkContainer>
            <a href={speedUpTxLink} target="_blank" rel="noreferrer">
              View transaction
            </a>
          </SpeedUpTxLinkContainer>
        )}
      </Content>
    </Overlay>
  );
}

function AlertBox({
  isCorrectChain,
  speedUpError,
  isRelayerFeeFairlyPriced,
  sourceChainId,
  onClickSwitch,
}: {
  isCorrectChain: boolean;
  speedUpError?: string;
  isRelayerFeeFairlyPriced: boolean;
  sourceChainId: number;
  onClickSwitch: () => void;
}) {
  if (!isCorrectChain) {
    return (
      <ErrorBox>
        <div>
          <Info />
        </div>
        <p>
          You are on an incorrect network. Please{" "}
          <button onClick={onClickSwitch}>
            switch to {getChainInfo(sourceChainId).name}
          </button>
        </p>
      </ErrorBox>
    );
  } else if (speedUpError) {
    return (
      <ErrorBox>
        <div>
          <Info />
        </div>
        <p>{speedUpError}</p>
      </ErrorBox>
    );
  } else if (isRelayerFeeFairlyPriced) {
    return (
      <InfoBox>
        <div>
          <Info />
        </div>
        <p>
          Note: The relay is already fairly priced compared to other
          transactions with similar characteristics.
        </p>
      </InfoBox>
    );
  }

  return null;
}

function SuccessContent({ onClose }: Pick<Props, "onClose">) {
  return (
    <>
      <SuccessContainer>
        <Title>Success</Title>
        <Zap size={64} />
        <p>Transaction was sped up successfully.</p>
      </SuccessContainer>
      <ButtonsRow>
        <CancelButton size="md" onClick={onClose}>
          Close
        </CancelButton>
      </ButtonsRow>
    </>
  );
}
