import styled from "@emotion/styled";

export const ButtonV2 = styled.button<{ size: "sm" | "md" | "lg" }>`
  position: relative;
  font-family: "Barlow";
  font-weight: 500;
  font-size: ${({ size }) => {
    if (size === "lg") return "18px";
    if (size === "md") return "16px";
    if (size === "sm") return "14";
  }};
  line-height: ${({ size }) => {
    if (size === "lg") return "26px";
    if (size === "md") return "20px";
    if (size === "sm") return "18px";
  }};
  padding: ${({ size }) => {
    if (size === "lg") return "19px 40px";
    if (size === "md") return "10px 20px";
    if (size === "sm") return "7px 12px";
  }};
  color: #2d2e33;
  background-color: #6cf9d8;
  border-radius: 32px;
  transition: opacity 0.1s;
  border: none;
  cursor: pointer;

  :hover {
    opacity: 0.5;
  }

  :focus {
    opacity: 1;
  }

  :active {
    ::after {
      content: "";
      position: absolute;
      top: -3px;
      bottom: -3px;
      left: -3px;
      right: -3px;
      border-radius: 40px;
      border: 1px solid #6cf9d8;
    }
  }

  :disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
`;
