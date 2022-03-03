import styled from "@emotion/styled";
import { PrimaryButton } from "components/Buttons";

export const Wrapper = styled.div`
  margin: 0 auto;
  max-width: 1900px;
  padding: 2rem;
`;

export const Title = styled.h2`
  font-size: ${30 / 16}rem;
  line-height: ${32 / 16}rem;
  font-weight: 700;
`;

export const ConnectButton = styled(PrimaryButton)`
  margin-top: 3rem;
  width: 200px;
  height: 50px;
  padding: 0;
`;
