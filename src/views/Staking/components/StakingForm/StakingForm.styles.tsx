import styled from "@emotion/styled";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background-color: #34353b;
  border: 1px solid #3e4047;
  border-radius: 10px;
  box-sizing: border-box;
`;

export const Tabs = styled.div`
  display: flex;
  justify-content: center;
  width: calc(100% - 48px);
  margin: 0 auto 24px;
  justify-items: center;
`;

interface ITab {
  active: boolean;
}
export const Tab = styled.div<ITab>`
  flex-grow: 1;
  font-family: "Barlow";
  font-style: normal;
  font-weight: 500;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  color: ${({ active }) => (active ? "#e0f3ff" : "#9DAAB2")};
  text-align: center;
  padding: 24px 0 20px;
  border-bottom: ${(props) =>
    props.active ? "2px solid #e0f3ff" : "2px solid transparent"};
  cursor: pointer;
`;

export const InputRow = styled.div`
  display: flex;
  width: calc(100% - 48px);
  margin: 0 auto;
  gap: 16px;
`;

export const InputWrapper = styled.div`
  flex-grow: 8;
`;

export const Input = styled.input`
  padding: 9px 24px;
`;

export const ButtonWrapper = styled.div`
  flex-grow: 1;
`;
export const StakeButton = styled(UnstyledButton)`
  background: #6cf9d8;
  padding: 0px 40px;
  gap: 4px;
  height: 64px;
  color: #2d2e33;
  flex-grow: 1;
`;
