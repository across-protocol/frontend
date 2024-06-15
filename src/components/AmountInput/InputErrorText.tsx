import styled from "@emotion/styled";

import { Text } from "components/Text";
import { ReactComponent as II } from "assets/icons/info-16.svg";

type Props = {
  errorText: string;
};

export function InputErrorText({ errorText }: Props) {
  return (
    <ErrorWrapper>
      <ErrorIcon />
      <ErrorText size="sm" color="error">
        {errorText}
      </ErrorText>
    </ErrorWrapper>
  );
}

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;

  width: 100%;
`;

const ErrorIcon = styled(II)`
  height: 16px;
  width: 16px;

  & path {
    stroke: #f96c6c !important;
  }
`;

const ErrorText = styled(Text)`
  max-width: 400px;
`;
