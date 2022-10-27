import styled from "@emotion/styled";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
`;

export const StepItem = styled.div`
  flex: 0 0 30px;
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #4c4e57;
  width: 32px;
  height: 32px;
  padding: 10px;
  border-radius: 10px;
  background-color: #e0f3ff;
  margin-bottom: 6px;
  font-size: ${14 / 16}rem;
  border: 1px solid #e0f3ff;
  cursor: default;
`;

export const Seperator = styled.div`
  height: 2px;
  flex: 1 1 0;
  margin: 0 12px;
  background-color: #4c4e57;
`;

export const StepItemComplete = styled(StepItem)`
  background-color: #3e4047;
  path {
    fill: #e0f3ff;
  }
`;

export const SeperatorComplete = styled(Seperator)`
  background-color: #e0f3ff;
`;

export const NextStepItem = styled(StepItem)`
  background-color: #35343b;
  color: #9daab2;
  border: 1px solid #9daab2;
`;
