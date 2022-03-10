import styled from "@emotion/styled";
import { PrimaryButton } from "components/Buttons";

export const Wrapper = styled.div`
  margin: 0 auto;
  max-width: 1900px;
  padding: 2rem;
`;

export const Title = styled.div`
  font-size: ${30 / 16}rem;
  line-height: ${32 / 16}rem;
  font-weight: 700;
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
