import styled from "@emotion/styled";
import { PrimaryButton } from "components/Buttons";

export const Wrapper = styled.div`
  background-color: transparent;
`;

export const Title = styled.div`
  font-size: ${30 / 16}rem;
  line-height: ${32 / 16}rem;
  font-weight: 700;
  margin: 0 auto;
  max-width: 1700px;
`;

export const Account = styled.span`
  font-size: ${16 / 16}rem;
  font-weight: 400;
  margin-left: 16px;
`;

export const ConnectButton = styled(PrimaryButton)`
  margin-top: 3rem;
  width: 200px;
  height: 50px;
  padding: 0;
`;

export const ButtonWrapper = styled.div`
  margin: 0 auto;
  max-width: 1700px;
`;

export const TopRow = styled.div`
  background-color: var(--color-gray-175);
  padding: 2rem;
`;
export const BottomRow = styled.div`
  background-color: var(--color-gray-500);

  padding: 2rem;
`;

export const TitleRow = styled.div`
  padding: 2rem;
`;
