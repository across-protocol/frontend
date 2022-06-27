import styled from "@emotion/styled";

export const StyledStepperItem = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  justify-content: space-evenly;
  .step-counter {
    color: #2d2e33;

    position: relative;
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    padding: 10px;
    border-radius: 10px;
    background: #e0f3ff;
    margin-bottom: 6px;
    font-size: ${14 / 16}rem;
  }

  &::after {
    position: absolute;
    content: "";
    border-bottom: 2px solid #4c4e57;
    width: 88%;
    top: 17px;
    left: 50%;
    z-index: 2;
  }
  &.completed::after {
    border-bottom: 2px solid #e0f3ff;
  }

  &.completed::before {
    position: absolute;
    content: "";
    border-bottom: 2px solid #ccc;
    width: 88%;
    top: 17px;
    left: 50%;
    z-index: 2;
  }

  &.start::after {
    left: 27%;
  }

  &.before-middle::after {
    left: 47%;
  }

  &.middle::after {
    left: 67%;
  }

  &.after-middle::after {
    left: 86%;
  }

  &.before-middle {
    .step-counter {
      margin-right: 35%;
    }
  }

  &.after-middle {
    .step-counter {
      margin-left: 40%;
    }
  }

  &.completed {
    .step-counter.checkmark {
      background-color: #3e4047;
      border: 1px solid #e0f3ff;
      svg {
        height: 12px;
      }
      path {
        fill: #e0f3ff;
      }
    }

    &.before-middle::before {
      left: 47%;
    }

    &.middle::before {
      left: 67%;
    }

    &.after-middle::before {
      left: 86%;
    }
  }

  &:first-of-type {
    justify-content: flex-start;
    align-items: flex-start;

    &::before {
      content: none;
    }
  }

  .after-middle {
    .step-counter {
      margin-left: 30%;
    }
  }

  &:last-of-type {
    justify-content: flex-end;
    align-items: flex-end;

    &::after {
      content: none;
    }
  }

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const StyledStepper = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;
