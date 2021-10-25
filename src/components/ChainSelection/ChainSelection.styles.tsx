import styled from "@emotion/styled";
import { PrimaryButton } from "../Buttons";
import { RoundBox as UnstyledBox } from "../Box";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const RoundBox = styled(UnstyledBox)`
  display: flex;
  align-items: center;
  margin-top: 16px;
`;

export const ConnectButton = styled(PrimaryButton)`
  margin-top: 16px;
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 20px;
`;
