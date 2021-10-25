import styled from "@emotion/styled";
import { RoundBox } from "../Box";
import { SecondaryButton } from "../Buttons";

export const Wrapper = styled(RoundBox)`
  background-color: inherit;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  cursor: pointer;
`;

export const ConnectButton = styled(SecondaryButton)`
  padding: 12px 16px;
  border: 1px solid transparent;
`;

export const Account = styled.div`
  background-color: var(--color-gray);
  color: var(--color-white);
  display: grid;
  place-items: center;
  padding: 0 30px;
  border-radius: 0 var(--radius) var(--radius) 0;
  border: 1px solid var(--color-gray);
`;

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-transform: capitalize;
  border-radius: var(--radius) 0 0 var(--radius);
  border: 1px solid var(--color-gray);
  padding: 10px 20px 5px;
  white-space: nowrap;
  & > div {
    line-height: 1;
  }
  & > div:last-of-type {
    color: var(--color-gray-300);
    font-size: ${14 / 16}rem;
  }
`;
