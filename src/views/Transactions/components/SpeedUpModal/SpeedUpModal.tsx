import React, { useState, useEffect } from "react";
import { Info, Zap, X } from "react-feather";
import { BigNumber } from "ethers";

import { formatWeiPct, getChainInfo } from "utils";
import { maxRelayFee, minRelayFee } from "utils/constants";
import { Text } from "components/Text";

import {
  Overlay,
  Content,
  SuccessContainer,
  SpeedUpTxLinkContainer,
  InfoBox,
  ErrorBox,
  ButtonsRow,
  CloseHeaderRow,
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
    isWrongNetwork,
    isWrongNetworkHandler,
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
          Number(formatWeiPct(transfer.depositRelayerFeePct, 3)) / 100;
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
  }, [relayFeeInput, transfer.depositRelayerFeePct]);

  const handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget.value;
    setRelayFeeInput(input);
  };

  const isRelayerFeeFairlyPriced = suggestedRelayerFeePct
    ? BigNumber.from(transfer.depositRelayerFeePct).gte(suggestedRelayerFeePct)
    : false;
  const isConfirmDisabled =
    !relayFeeInput || !!inputError || speedUp.isLoading || isWrongNetwork;

  return (
    <Overlay isOpen={isOpen} onDismiss={onClose}>
      <Content aria-label="speed-up-modal">
        {speedUp.isSuccess ? (
          <SuccessContent onClose={onClose} />
        ) : (
          <>
            <Text size="xl">Speed up transaction</Text>
            <AlertBox
              isCorrectChain={!isWrongNetwork}
              speedUpError={speedUp.isError ? "Speed up failed" : undefined}
              isRelayerFeeFairlyPriced={isRelayerFeeFairlyPriced}
              sourceChainId={transfer.sourceChainId}
              onClickSwitch={isWrongNetworkHandler}
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
                onClick={() =>
                  speedUp.mutate({
                    newRelayerFeePct: feeInputToBigNumberPct(relayFeeInput),
                  })
                }
              >
                {speedUp.isLoading ? "Confirming..." : "Confirm"}
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
        <Text color="error">
          You are on the incorrect network. Please{" "}
          <button onClick={onClickSwitch}>
            switch to {getChainInfo(sourceChainId).name}
          </button>
        </Text>
      </ErrorBox>
    );
  } else if (speedUpError) {
    return (
      <ErrorBox>
        <div>
          <Info />
        </div>
        <Text color="error">{speedUpError}</Text>
      </ErrorBox>
    );
  } else if (isRelayerFeeFairlyPriced) {
    return (
      <InfoBox>
        <div>
          <Info />
        </div>
        <Text color="warning">
          Note: The relay is already fairly priced compared to other
          transactions with similar characteristics.
        </Text>
      </InfoBox>
    );
  }

  return null;
}

function SuccessContent({ onClose }: Pick<Props, "onClose">) {
  return (
    <>
      <CloseHeaderRow>
        <X size={16} onClick={onClose} />
      </CloseHeaderRow>
      <SuccessContainer>
        <Text size="xl">Success</Text>
        <Zap size={64} />
        <Text>Transaction was sped up successfully.</Text>
      </SuccessContainer>
    </>
  );
}
