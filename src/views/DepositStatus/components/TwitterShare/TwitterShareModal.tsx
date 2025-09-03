import styled from "@emotion/styled";
import { LoadingSkeleton, SecondaryButton, Text } from "components";
import Modal from "components/Modal";
import { ModalProps } from "components/Modal/Modal";
import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import {
  COLORS,
  QUERIES,
  twitterParams,
  twitterShareContestActive,
} from "utils";
import { ReactComponent as X } from "assets/icons/x-white.svg";
import { useState } from "react";
import { useCopyToClipboard } from "hooks/useCopyToClipboard";
import { CopyButton } from "../CopyButton";
import { css } from "@emotion/react";

type TwitterShareModalProps = ModalProps & {
  imageUrl: string;
};

export function TwitterShareModal({
  imageUrl,
  ...props
}: TwitterShareModalProps) {
  const { isMobile } = useCurrentBreakpoint();
  const [isImageLoading, setIsImageLoading] = useState(true);

  const {
    copyToClipboard,
    isCopying,
    success: copySuccess,
    error: copyError,
    resetState,
  } = useCopyToClipboard({
    onSuccess: () => setTimeout(() => resetState(), 1500),
    onError: (error) => {
      console.error("Failed to copy image to clipboard:", error);
      setTimeout(() => resetState(), 1500);
    },
  });

  const handleCopyToClipboard = async () => {
    const tweetText =
      "Check out how fast I just bridged with @AcrossProtocol\n #PoweredByIntents ⛺";
    await copyToClipboard([
      { content: tweetText },
      { content: imageUrl, remote: true },
    ]);
  };

  return (
    <TwitterModal
      verticalLocation={{
        tablet: "bottom",
        desktop: "top",
        mobile: "bottom",
      }}
      topYOffset={isMobile ? undefined : 112}
      bottomYOffset={isMobile ? 16 : undefined}
      exitOnOutsideClick
      title={twitterParams.modalTitle}
      padding="normal"
      titleBorder
      width={900}
      {...props}
    >
      <ModalContent>
        <ImageContainer>
          {isImageLoading && (
            <Placeholder borderRadius="0px" width="200%" height="200%" />
          )}
          <Image
            src={imageUrl}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
            style={{ display: isImageLoading ? "none" : "block" }}
          />
        </ImageContainer>
        <TextColumn>
          <TextInnerColumn>
            <Text size="xl" color="white">
              1. Copy image to clipboard
            </Text>
            <Text size="md">Copy your Across flex image to clipboard.</Text>
            <ButtonRow>
              <StyledCopyButton
                size="md"
                onClick={handleCopyToClipboard}
                disabled={isImageLoading || isCopying}
                copyState={
                  copySuccess ? "success" : copyError ? "error" : "ready"
                }
              />
            </ButtonRow>
          </TextInnerColumn>

          <TextInnerColumn>
            <Text size="xl" color="white">
              2. Share on X (Twitter)
            </Text>
            <Text size="md">Just paste (Ctrl+V / ⌘+V) before posting!</Text>

            <ButtonRow>
              <Button
                size="md"
                textColor="aqua"
                onClick={() => {
                  window.open("https://twitter.com/intent/tweet", "__blank");
                }}
              >
                SHARE ON <XIcon />
              </Button>
            </ButtonRow>
          </TextInnerColumn>

          {twitterShareContestActive && (
            <TextInnerColumn>
              <Text size="xl" color="white">
                3. Follow{" "}
                <Link href="https://x.com/AcrossProtocol" target="_blank">
                  @AcrossProtocol
                </Link>
              </Text>
              <Text size="md">
                Winners will be announced at the end of each week. Make sure to
                follow Across and turn on your notifications so you don't miss
                it!
              </Text>
            </TextInnerColumn>
          )}
        </TextColumn>
      </ModalContent>
    </TwitterModal>
  );
}

const Link = styled.a`
  font-size: inherit;
  color: ${COLORS.aqua};
  text-decoration: none;
  transition: opacity 0.1s;

  &:hover {
    opacity: 0.8;
  }
`;

const ButtonStyled = css`
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(108, 249, 216, 0.1);

  &:hover:not(:disabled) {
    border-color: ${COLORS.aqua};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Button = styled(SecondaryButton)`
  ${ButtonStyled}
`;

const StyledCopyButton = styled(CopyButton)`
  ${ButtonStyled}
`;

const TwitterModal = styled(Modal)`
  gap: 0px;

  @media ${QUERIES.laptopAndUp} {
    padding-bottom: 0px !important;
  }
`;

const Placeholder = styled(LoadingSkeleton)`
  transform: rotate(343deg);
  width: 200%;
  height: 200%;
  margin: -50% -50%;
`;

const ImageContainer = styled.div`
  aspect-ratio: 1/1;
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  border: 1px solid rgba(224, 243, 255, 0.2);
  box-shadow: rgba(108, 249, 216, 0.15) 0px 0px 20px 3px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
`;

const XIcon = styled(X)`
  margin-left: 4px;
  color: ${COLORS["aqua"]};
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ButtonRow = styled(Row)`
  margin-top: calc(var(--spacing) / 3);
  gap: calc(var(--spacing) / 3);
`;

const ModalContent = styled.div`
  --spacing: 24px;
  width: calc(100% + 2 * var(--spacing));

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing);
  color: var(--Color-Neutrals-light-200, #e0f3ff);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: var(--spacing);
  margin-left: calc(-1 * var(--spacing));
  margin-top: calc(-1 * var(--spacing));

  @media ${QUERIES.laptopAndUp} {
    flex-direction: row;
    padding: 0 var(--spacing);
  }
`;

const TextColumn = styled(Column)`
  padding: var(--spacing) 0;
  gap: var(--spacing);
  align-items: center;
  text-align: center;

  @media ${QUERIES.laptopAndUp} {
    align-items: flex-start;
    gap: 40px;
    text-align: start;
  }
`;

const TextInnerColumn = styled(Column)`
  gap: calc(var(--spacing) / 3);

  @media ${QUERIES.laptopAndUp} {
    align-items: flex-start;
    padding: 0 var(--spacing);
  }
`;
