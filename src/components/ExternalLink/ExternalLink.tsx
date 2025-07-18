import styled from "@emotion/styled";

import { ReactComponent as ExternalLink12Icon } from "assets/icons/arrow-up-right.svg";

type Props = {
  text: string;
  href: string;
  className?: string;
};

export function ExternalLink(props: Props) {
  return (
    <Link
      className={props?.className}
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.text} <ExternalLinkIcon />
    </Link>
  );
}

const Link = styled.a`
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 500;
  text-decoration: none;
  color: #e0f3ff;
  transition: opacity 0.1s;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  @media (max-width: 428px) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const ExternalLinkIcon = styled(ExternalLink12Icon)`
  margin: 2px 0 0 4px;
  color: inherit;
`;
