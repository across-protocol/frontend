// Core button component, used by all states
import React from "react";
import { BridgeButtonState } from "./ConfirmationButton";
import { ReactComponent as LoadingIcon } from "assets/icons/loading-2.svg";
import { ReactComponent as Wallet } from "assets/icons/wallet.svg";
import { ReactComponent as Warning } from "assets/icons/warning_triangle_filled.svg";
import styled from "@emotion/styled";
import { COLORS } from "../../../../utils";

export const CoreConfirmationButton: React.FC<{
  label: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  state: BridgeButtonState;
  fullHeight?: boolean;
  onClick?: () => void;
}> = ({ label, loading, disabled, state, onClick, fullHeight }) => (
  <StyledButton
    data-cy="bridge-button"
    disabled={disabled || loading}
    onClick={onClick}
    aqua={!disabled}
    buttonLoading={loading}
    fullHeight={fullHeight}
  >
    <ButtonContent>
      {loading && <StyledLoadingIcon />}
      {state === "notConnected" && (
        <Wallet width={16} height={16} color="inherit" />
      )}
      {state === "apiError" && (
        <Warning width={16} height={16} color="inherit" />
      )}
      {label}
    </ButtonContent>
  </StyledButton>
);

const StyledButton = styled.button<{
  aqua?: boolean;
  buttonLoading?: boolean;
  fullHeight?: boolean;
}>`
  width: 100%;
  height: 64px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition:
    background 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease,
    opacity 0.3s ease;
  border: none;
  cursor: pointer;

  background: ${({ aqua }) =>
    aqua ? COLORS.aqua : "rgba(224, 243, 255, 0.05)"};
  color: ${({ aqua }) => (aqua ? "#2D2E33" : "#E0F3FF")};

  &:not(:disabled):hover {
    box-shadow: ${({ aqua }) =>
      aqua
        ? `0 0 10px 0 var(--Transparency-Bright-Gray-bright-gray-50, rgba(224, 243, 255, 0.50)) inset, 0 0 4px 2px var(--Transparency-Aqua-aqua-20, rgba(108, 249, 216, 0.20)), 0 2px 12px 1px var(--Transparency-Aqua-aqua-20, rgba(108, 249, 216, 0.20)), 0 4px 24px 2px var(--Transparency-Aqua-aqua-20, rgba(108, 249, 216, 0.20))`
        : `
      `};
  }

  &:not(:disabled):focus {
    ${({ aqua }) => !aqua && `box-shadow: 0 0 16px 0 ${COLORS.aqua};`}
  }

  &:disabled {
    cursor: ${({ buttonLoading }) => (buttonLoading ? "wait" : "not-allowed")};
    box-shadow: none;
    opacity: ${({ buttonLoading }) => (buttonLoading ? 0.9 : 0.6)};
  }

  &:focus {
    outline: none;
  }
`;

const ButtonContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const StyledLoadingIcon = styled(LoadingIcon)`
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  color: inherit;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
