import styled from "@emotion/styled";
import { useState } from "react";
import { useCopyToClipboard } from "hooks/useCopyToClipboard";
import { COLORS } from "utils";

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
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.33333 5.33333V3.46667C5.33333 2.72 5.33333 2.34667 5.48533 2.06133C5.62 1.81 5.83 1.6 6.08133 1.46533C6.36667 1.31333 6.74 1.31333 7.48667 1.31333H12.5333C13.28 1.31333 13.6533 1.31333 13.9387 1.46533C14.19 1.6 14.4 1.81 14.5347 2.06133C14.6867 2.34667 14.6867 2.72 14.6867 3.46667V8.51333C14.6867 9.26 14.6867 9.63333 14.5347 9.91867C14.4 10.17 14.19 10.38 13.9387 10.5147C13.6533 10.6667 13.28 10.6667 12.5333 10.6667H10.6667M3.46667 14.6667H8.51333C9.26 14.6667 9.63333 14.6667 9.91867 14.5147C10.17 14.38 10.38 14.17 10.5147 13.9187C10.6667 13.6333 10.6667 13.26 10.6667 12.5133V7.46667C10.6667 6.72 10.6667 6.34667 10.5147 6.06133C10.38 5.81 10.17 5.6 9.91867 5.46533C9.63333 5.31333 9.26 5.31333 8.51333 5.31333H3.46667C2.72 5.31333 2.34667 5.31333 2.06133 5.46533C1.81 5.6 1.6 5.81 1.46533 6.06133C1.31333 6.34667 1.31333 6.72 1.31333 7.46667V12.5133C1.31333 13.26 1.31333 13.6333 1.46533 13.9187C1.6 14.17 1.81 14.38 2.06133 14.5147C2.34667 14.6667 2.72 14.6667 3.46667 14.6667Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
