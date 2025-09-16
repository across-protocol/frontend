import styled from "@emotion/styled";
import { COLORS } from "utils";
import { Info } from "react-feather";

export function TermsOfServiceDisclaimer() {
  return (
    <Disclaimer>
      <Icon width="1em" height="1em" />
      <span>By connecting a wallet, you agree to Risk Labs'</span>{" "}
      <a
        target="_blank"
        rel="noreferrer"
        href="https://across.to/terms-of-service"
      >
        Terms of Service
      </a>
      .
    </Disclaimer>
  );
}

const Icon = styled(Info)`
  width: 1em;
  height: 1em;
  margin-right: 0.5em;
`;

const Disclaimer = styled.div`
  padding: 18px 24px;
  font-weight: 500;

  span,
  svg {
    display: inline-block;
    vertical-align: middle;
  }

  a {
    color: ${COLORS.aqua};
    transition: opacity 300ms ease-in-out;

    &:hover {
      opacity: 0.6;
    }
  }
`;
