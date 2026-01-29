import styled from "@emotion/styled";
import { useState } from "react";
import { useCopyToClipboard } from "hooks/useCopyToClipboard";
import { COLORS } from "utils";
import { ReactComponent as CopyIcon } from "assets/icons/copy-document.svg";

type Props = {
  textToCopy: string;
  className?: string;
};

export function CopyIconButton({ textToCopy, className }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { copyToClipboard, success } = useCopyToClipboard();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await copyToClipboard([{ content: textToCopy }]);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <ButtonWrapper className={className}>
      <CopyButton onClick={handleCopy} aria-label="Copy to clipboard">
        <CopyIcon />
      </CopyButton>
      {showTooltip && (
        <Tooltip>{success ? "Copied!" : "Failed to copy"}</Tooltip>
      )}
    </ButtonWrapper>
  );
}

const ButtonWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${COLORS["grey-400"]};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border-radius: 4px;

  &:hover {
    color: ${COLORS.aqua};
    background: rgba(108, 249, 216, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: ${COLORS["grey-600"]};
  color: ${COLORS.white};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  border: 1px solid ${COLORS["grey-500"]};
  z-index: 1000;
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
