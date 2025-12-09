import styled from "@emotion/styled";
import { COLORS, withOpacity } from "utils";

export const TokenInputWrapper = styled.div`
  display: flex;
  min-height: 148px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  background: transparent;
  position: relative;
  padding: 24px;
  border-radius: 24px;
  background: ${COLORS["black-700"]};
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.08);
`;

export const TokenSelectorColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

export const TokenAmountStack = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;

  height: 100%;
  margin-right: 24px;
  min-width: 0;
  flex: 1;
`;

export const TokenAmountInputTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.aqua};
  font-size: 16px;
  font-weight: 500;
  line-height: 130%;
`;

export const TokenAmountInputWrapper = styled.div<{
  showPrefix: boolean;
  value: string;
  error: boolean;
}>`
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  overflow: hidden;

  font-size: clamp(20px, 7cqw, 48px);
  font-weight: 300;
  line-height: 120%;
  letter-spacing: -1.92px;

  color: ${({ value, error }) =>
    error ? COLORS.error : value ? COLORS.aqua : COLORS["light-200"]};

  ${({ showPrefix, value, error }) =>
    showPrefix &&
    `
    &::before {
      content: "$";
      margin-right: 4px;
      flex-shrink: 0;
      font-size: inherit;
      font-weight: 300;
      line-height: 120%;
      letter-spacing: -1.92px;
      color: ${error ? COLORS.error : value ? COLORS.aqua : "var(--base-bright-gray, #e0f3ff)"};
      opacity: ${value ? 1 : 0.5};
    }
  `}
`;

export const TokenAmountInput = styled.input<{
  value: string;
  error: boolean;
}>`
  width: 100%;
  outline: none;
  border: none;
  background: transparent;
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit !important;
  line-height: inherit;
  letter-spacing: inherit;
  color: ${({ value, error }) =>
    error
      ? COLORS.error
      : value
        ? COLORS.aqua
        : "var(--base-bright-gray, #e0f3ff)"};
  flex-shrink: 0;

  &:focus {
    outline: none;
    font-size: inherit !important;
  }

  &::placeholder {
    color: var(--base-bright-gray, #e0f3ff);
    opacity: 0.5;
  }
`;

export const UnitToggleButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`;

export const UnitToggleButton = styled.button`
  color: ${withOpacity("#e0f3ff", 0.5)};

  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;

  &:hover:not(:disabled) {
    svg {
      color: #e0f3ff;
    }
  }

  span {
    color: inherit;
    overflow: hidden;
    white-space: nowrap;
    min-width: 0;
    text-overflow: ellipsis;
  }

  svg {
    color: inherit;
  }
`;
