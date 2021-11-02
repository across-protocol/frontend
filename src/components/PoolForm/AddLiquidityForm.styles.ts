import styled from "@emotion/styled";

import { RoundBox as UnstyledBox } from "../Box";
import { SecondaryButton, PrimaryButton } from "../Buttons";

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
    outline: var(--outline-color) solid 1px;
  }
`;

export const MaxButton = styled(SecondaryButton)`
  text-transform: uppercase;
  padding: 10px 20px;
  font-size: ${14 / 16}rem;
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
  background: hsla(166, 92%, 70%, 1);
  color: hsla(230, 6%, 19%, 1);
  font-weight: 700;
  font-size: 1.1.rem;
  line-height: 1.25rem;
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
`;

export const FormHeader = styled.h2`
  font-weight: 600;
  font-size: 1.25rem;
  line-height: 1.5rem;
  margin-bottom: 1rem;
`;

export const Balance = styled.div`
  display: flex;
  justify-content: flex-end;
  span {
    --color: var(--color-primary);
    font-size: 0.75rem;
    line-height: 1rem;
    margin-right: 1.5rem;
    margin-top: 0.66rem;
  }
`;
