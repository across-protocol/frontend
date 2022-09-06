import React, { useState } from "react";
import styled from "@emotion/styled";

type Props = React.HTMLProps<HTMLInputElement> & {
  label?: string;
  error?: string;
  Button: React.ReactElement;
};

export function InputWithButton({
  label,
  error,
  Button,
  onBlur,
  onFocus,
  ...inputProps
}: Props) {
  const [isInputFocused, setIsInputFocused] = useState(false);

  return (
    <Container>
      <InputContainer>
        {label && <label>{label}</label>}
        <InputWithButtonContainer
          isInputFocused={isInputFocused}
          hasError={!!error}
        >
          <input
            onFocus={(e) => {
              setIsInputFocused(true);
              onFocus && onFocus(e);
            }}
            onBlur={(e) => {
              setIsInputFocused(false);
              onBlur && onBlur(e);
            }}
            {...inputProps}
          />
          {Button}
        </InputWithButtonContainer>
      </InputContainer>
      {error && <ErrorContainer>{error}</ErrorContainer>}
    </Container>
  );
}

const Container = styled.div``;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;

  label {
    font-weight: 400;
    font-size: ${18 / 16}rem;
    line-height: ${26 / 16}rem;
    color: #9daab2;
  }
`;

const InputWithButtonContainer = styled.div<{
  isInputFocused: boolean;
  hasError: boolean;
}>`
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: #2d2e33;
  border: 1px solid
    ${({ isInputFocused, hasError }) =>
      hasError ? "#f96c6c" : isInputFocused ? "#E0F3FF" : "#3e4047"};
  border-radius: 32px;
  padding: 9px 24px;
  height: 64px;
  gap: 16px;

  color: #9daab2;
  font-weight: 400;

  input {
    flex: 1;
    color: #9daab2;
    font-weight: 400;
    font-size: 18px;
    line-height: 26px;

    border: none;
    outline: none;
    background: transparent;
  }

  button {
    cursor: pointer;
    color: #9daab2;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    letter-spacing: 0.04em;
    text-transform: uppercase;

    background-color: transparent;
    border: 1px solid #4c4e57;
    border-radius: 24px;
    padding: 8px 10px 10px;

    width: 44px;
    height: 24px;

    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const ErrorContainer = styled.div`
  color: #f96c6c;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 16px;
`;
