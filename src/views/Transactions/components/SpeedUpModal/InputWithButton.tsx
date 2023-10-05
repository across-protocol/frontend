import React, { useState } from "react";
import styled from "@emotion/styled";

import { QUERIESV2 } from "utils";
import { Text } from "components/Text";

type Props = React.HTMLProps<HTMLInputElement> & {
  label?: string;
  error?: string;
  Button?: React.ReactElement;
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
        {label && (
          <label>
            <Text>{label}</Text>
          </label>
        )}
        <InputWithButtonContainer
          isInputFocused={isInputFocused}
          hasError={Boolean(error)}
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
          {Button && Button}
        </InputWithButtonContainer>
      </InputContainer>
      {error && (
        <ErrorContainer>
          <Text color="error">{error}</Text>
        </ErrorContainer>
      )}
    </Container>
  );
}

const Container = styled.div``;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: start;
    gap: 8px;
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

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    width: 100%;
  }

  input {
    flex: 1;
    color: #9daab2;
    font-weight: 400;
    font-size: 18px;
    line-height: 26px;

    border: none;
    outline: none;
    background: transparent;

    @media ${QUERIESV2.sm.andDown} {
      width: 100%;
    }
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
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 16px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: end;
    padding: 8px 0px;
  }
`;
