import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

export const Wrapper = styled.div``;

export const TitleRow = styled.div`
  color: #e0f3ff;
  font-size: ${20 / 16}rem;
  svg {
    margin-right: 8px;
  }
`;

export const Body = styled.div`
  color: #c5d5e0;
  font-size: ${14 / 16}rem;
`;

export const ToolTips = styled.div`
  display: inline-block;
  svg {
    margin: 0;
    &:last-of-type {
      margin-left: -2px;
      margin-right: 8px;
    }
  }
`;

const GC = styled(FontAwesomeIcon)`
  margin-top: 4px;
  margin-left: 8px;
  path {
    fill: var(--color-primary);
  }
`;
export const GreenCheckmark = () => <GC icon={faCheckCircle} />;
