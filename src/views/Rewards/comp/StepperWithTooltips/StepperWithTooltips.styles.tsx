import styled from "@emotion/styled";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  margin: ${24 / 16}rem 0;

  @media screen and (max-width: 428px) {
    margin: ${20 / 16}rem 0;
  }
`;

export const StepItem = styled.div`
  flex: 0 0 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e0f3ff;
  font-size: ${12 / 16}rem;
  line-height: ${14 / 16}rem;
  font-weight: 400;
  color: #2d2e33;
  border: 1px solid #e0f3ff;
  border-radius: 10px;
  cursor: pointer;
  z-index: 5;

  @media screen and (max-width: 428px) {
    flex: 0 0 24px;
    height: 24px;
    border-radius: 7px;
  }
`;

export const Seperator = styled.div`
  height: 1px;
  flex: 1 1 0;
  margin: 0 8px;
  background-color: #4c4e57;

  @media screen and (max-width: 428px) {
    margin: 0 4px;
  }
`;

export const StepItemComplete = styled(StepItem)`
  background-color: #35343b;
  border-radius: 18px;

  path {
    fill: #e0f3ff;
  }

  @media screen and (max-width: 428px) {
    border-radius: 16px;
  }
`;

export const StepItemNext = styled(StepItem)`
  background-color: #34353b;
  color: #9daab2;
  border: 1px solid #4c4e57;
`;

export const SeperatorComplete = styled(Seperator)`
  background-color: #e0f3ff;
`;
