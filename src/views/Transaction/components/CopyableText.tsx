import styled from "@emotion/styled";
import { Text, TextColor, TextSize } from "components/Text";
import { CopyIconButton } from "./CopyIconButton";
import { CSSProperties } from "react";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-up-right.svg";
import { COLORS } from "utils";

type Props = {
  textToCopy: string;
  children: React.ReactNode;
  color?: TextColor;
  size?: TextSize;
  weight?: number;
  style?: CSSProperties;
  explorerLink?: string;
};

export function CopyableText({
  textToCopy,
  children,
  color,
  size,
  weight,
  style,
  explorerLink,
}: Props) {
  return (
    <Wrapper>
      <Text color={color} size={size} weight={weight} style={style}>
        {children}
      </Text>
      <ActionsWrapper>
        <CopyIconButton textToCopy={textToCopy} />
        {explorerLink && (
          <ExplorerLink
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            title="View on block explorer"
          >
            <StyledExternalLinkIcon />
          </ExplorerLink>
        )}
      </ActionsWrapper>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ExplorerLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
`;

const StyledExternalLinkIcon = styled(ExternalLinkIcon)`
  width: 14px;
  height: 14px;
  color: ${COLORS["grey-400"]};
`;
