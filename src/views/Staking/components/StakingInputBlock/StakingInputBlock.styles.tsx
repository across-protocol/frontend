import styled from "@emotion/styled";
import { PrimaryButton } from "components/Button";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ButtonWrapper = styled.div`
  width: 100%;
`;

export const StakeButton = styled(PrimaryButton)`
  text-transform: capitalize;
  width: 100%;
`;

export const StakeButtonContentWrapper = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-direction: row;
`;

export const IconPairContainer = styled.div`
  padding-top: 8px;
  margin-right: 8px;
`;
