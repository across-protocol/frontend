import styled from "@emotion/styled";

export const StyledStepperItem = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;

  .step-counter {
    position: relative;
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 35px;
    height: 35px;
    padding: 10px;
    border-radius: 50%;
    background: #ccc;
    margin-bottom: 6px;
  }

  &::after {
    position: absolute;
    content: "";
    border-bottom: 2px solid #ccc;
    width: 100%;
    top: 17px;
    left: 50%;
    z-index: 2;
  }

  &.completed {
    .step-counter {
      background-color: #4bb543;
    }
    &::before {
      position: absolute;
      content: "";
      border-bottom: 2px solid #4bb543;
      width: 100%;
      top: 17px;
      left: -50%;
      z-index: 3;
    }
  }

  &:first-child {
    &::before {
      content: none;
    }
  }

  &:last-child {
    &::after {
      content: none;
    }
  }

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const StyledStepper = styled.div`
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;
