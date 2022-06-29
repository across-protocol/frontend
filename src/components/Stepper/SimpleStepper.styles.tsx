import styled from "@emotion/styled";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const StepItem = styled.div`
  flex: 0 0 30px;
  /* height: 30px; */
  /* background-color: red; */
  /* position: relative;
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: center; */
  width: 32px;
  height: 32px;
  padding: 10px;
  border-radius: 10px;
  background: #e0f3ff;
  margin-bottom: 6px;
  font-size: ${14 / 16}rem;
`;

export const Seperator = styled.div`
  height: 2px;
  flex: 1 1 0;
  margin: 0 8px;
  background-color: #4c4e57;
`;
