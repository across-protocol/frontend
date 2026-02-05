import styled from "@emotion/styled";
import { COLORS } from "utils/constants";
import { withOpacity } from "utils/colors";

export function LegalDisclaimer() {
  return (
    <Disclaimer>
      <p>By connecting a wallet, you agree to Risk Labs' </p>
      <a
        target="_blank"
        rel="noreferrer"
        href="https://across.to/terms-of-service"
      >
        Terms of Service
      </a>{" "}
      <p>and consent to its </p>
      <a
        target="_blank"
        rel="noreferrer"
        href="https://across.to/privacy-policy"
      >
        Privacy Policy
      </a>
    </Disclaimer>
  );
}

const Disclaimer = styled.div`
  padding: 24px;
  font-size: 14px;
  font-weight: 400;
  color: ${withOpacity("var(--base-bright-gray)", 0.5)};
  line-height: 130%;

  p {
    display: inline;
  }

  a {
    font-weight: 600;
    color: inherit;
    display: inline;
    line-height: inherit;

    &:hover {
      color: ${COLORS.aqua};
      opacity: 1;
    }
  }
`;
