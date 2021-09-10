import React from "react";
import styled from "@emotion/styled";

export const BaseButton = styled.button`
  border: none;
  padding: 16px;
  border-radius: 30px;
  background: transparent;
  cursor: pointer;
  :disabled {
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled(BaseButton)`
  background-color: var(--gray);
  color: var(--white);
`;

export const PrimaryButton = styled(BaseButton)`
  background-color: var(--primary);
  color: var(--gray);
`;
