import styled from "@emotion/styled";

export const StyledStepperItem = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  justify-content: space-evenly;
  .step-counter {
    position: relative;
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 35px;
    height: 35px;
    padding: 10px;
    border-radius: 5px;
    background: #ccc;
    margin-bottom: 6px;
  }

  &::after {
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
