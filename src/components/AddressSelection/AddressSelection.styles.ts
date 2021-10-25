import styled from "@emotion/styled";
import { RoundBox as UnstyledRoundBox } from "../Box";
import { Section } from "../Section";
import { PrimaryButton, SecondaryButton, BaseButton } from "../Buttons";

export const LastSection = styled(Section)`
  border-bottom: none;
`;
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const RoundBox = styled(UnstyledRoundBox)`
  margin-top: 16px;
  display: flex;
  align-items: center;
`;

export const MainBox = styled(RoundBox)`
  --radius: 45px;
  padding: 10px 15px;
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 20px;
`;

export const Info = styled.div`
  & > div {
    line-height: 1;
  }
`;
export const Address = styled.div`
  color: var(--color-white-transparent);
  font-size: ${14 / 16}rem;
`;
export const ChangeButton = styled(SecondaryButton)`
  margin-left: auto;
  padding: 10px 14px;
  font-size: ${14 / 16}rem;
`;

export const DialogTitle = styled.h3``;

export const InputWrapper = styled(RoundBox)`
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--color-white);
  padding: 16px;
  margin: 14px 0 25px 0;
  &:focus-within {
    outline: var(--color-primary-dark) solid 1px;
  }
`;
export const Input = styled.input`
  width: 100%;
  border: none;
  background-color: inherit;
  outline: none;
`;

export const InputError = styled.div`
  color: var(--color-gray);
  font-size: ${12 / 16}rem;
  position: absolute;
  bottom: 0;
  right: 16px;
  transform: translateY(105%);
`;

export const ClearButton = styled(BaseButton)`
  padding: 0;
`;
export const CancelButton = styled(PrimaryButton)`
  border: 1px solid var(--color-gray-300);
`;
export const ButtonGroup = styled.div`
  display: flex;
  gap: 20px;
  & > button {
    flex: 1;
  }
`;
