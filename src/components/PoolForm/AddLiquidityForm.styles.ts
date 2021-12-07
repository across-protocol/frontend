import styled from "@emotion/styled";

import { RoundBox as UnstyledBox, ErrorBox } from "../Box";
import { PrimaryButton, SecondaryButtonWithoutShadow } from "../Buttons";

export const RoundBox = styled(UnstyledBox)`
  --color: var(--color-white);
  --outline-color: var(--color-primary);
  background-color: var(--color);
  font-size: ${16 / 16}rem;
  padding: 10px 15px;
  margin-top: 16px;
  flex: 2;
  display: flex;
  &:not(:first-of-type):focus-within {
    outline: 1px solid var(--outline-color);
  }
`;

export const MaxButton = styled(SecondaryButtonWithoutShadow)`
  text-transform: uppercase;
  padding: 10px 20px;
  font-size: ${14 / 16}rem;
  transition: background-color 100ms linear;

  &:hover {
    background-color: var(--color-gray-300);
  }
`;
export const Input = styled.input`
  border: none;
  font-size: inherit;
  background-color: inherit;
  padding: 0;
  margin: 0;
  width: 100%;
  text-align: right;
  outline: none;

  &::placeholder {
    color: var(--color-gray-300);
  }
`;

export const FormButton = styled(PrimaryButton)`
  margin-top: 2rem;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  background: var(--color-primary);
  color: var(--color-gray);
  font-size: ${18 / 16}rem;
  line-height: 1.1;
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
`;

export const FormHeader = styled.h2`
  font-weight: 600;
  font-size: ${20 / 16}rem;
  line-height: 1.2;
  margin-bottom: 16px;
`;

export const Balance = styled.div`
  display: flex;
  justify-content: flex-end;
  span {
    --color: var(--color-primary);
    font-size: ${12 / 16}rem;
    line-height: 1.33;
    margin-right: 24px;
    margin-top: 12px;
  }
`;

export const LiquidityErrorBox = styled(ErrorBox)`
  margin-top: 10px;
`;
