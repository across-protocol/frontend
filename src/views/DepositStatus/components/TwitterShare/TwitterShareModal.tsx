import styled from "@emotion/styled";
import { SecondaryButton, Text } from "components";
import Modal from "components/Modal";
import { ModalProps } from "components/Modal/Modal";
import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import { COLORS, QUERIES } from "utils";
import { ReactComponent as X } from "assets/icons/x-white.svg";
import { ReactComponent as Download } from "assets/icons/arrow-inbox.svg";

type TwitterShareModalProps = ModalProps & {};

export function TwitterShareModal(props: TwitterShareModalProps) {
  const { isMobile } = useCurrentBreakpoint();

  function handleCopyToClipboard() {}

  return (
    <Modal
      verticalLocation={{
        tablet: "top",
        desktop: "top",
        mobile: "bottom",
      }}
      topYOffset={isMobile ? undefined : 112}
      bottomYOffset={isMobile ? 16 : undefined}
      exitOnOutsideClick
      title="Share Your Bridge"
      padding="normal"
      titleBorder
      {...props}
    >
      <ModalContent>
        <ImageContainer />
        <TextColumn>
          <TextInnerColumn>
            <Text size="xl" color="white">
              1. Copy image to clipboard
            </Text>
            <Text size="md">Copy your Across flex image to clipboard.</Text>
            <ButtonRow>
              <Button size="md" onClick={handleCopyToClipboard}>
                COPY TO CLIPBOARD
              </Button>
              <Text size="md">or</Text>
              <DownloadButton size="md" onClick={handleCopyToClipboard}>
                <DownloadIcon width={16} height={16} color={COLORS["aqua"]} />
              </DownloadButton>
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
                  window.open("x.com", "__blank");
                }}
              >
                SHARE ON <XIcon />
              </Button>
            </ButtonRow>
          </TextInnerColumn>
        </TextColumn>
      </ModalContent>
    </Modal>
  );
}

const Button = styled(SecondaryButton)`
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(108, 249, 216, 0.1);

  &:hover:not(:disabled) {
    border-color: ${COLORS.aqua};
  }
`;

const DownloadButton = styled(SecondaryButton)`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: unset;
  border: 1px solid rgba(108, 249, 216, 0.1);

  &:hover:not(:disabled) {
    border-color: ${COLORS.aqua};
  }
`;

const DownloadIcon = styled(Download)`
  color: ${COLORS["aqua"]};
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

const ImageContainer = styled.div`
  aspect-ratio: 1/1;
  width: 100%;
  max-width: 350px;
  border-radius: 8px;
  border: 1px solid rgba(224, 243, 255, 0.2);
  box-shadow: rgba(108, 249, 216, 0.15) 0px 0px 20px 3px;
`;

const ModalContent = styled.div`
  --spacing: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing);
  color: var(--Color-Neutrals-light-200, #e0f3ff);

  @media ${QUERIES.laptopAndUp} {
    flex-direction: row;
  }
`;

const TextColumn = styled(Column)`
  padding: var(--spacing);
  gap: var(--spacing);
  align-items: center;

  @media ${QUERIES.tabletAndUp} {
    align-items: flex-start;
    gap: 40px;
  }
`;

const TextInnerColumn = styled(Column)`
  gap: calc(var(--spacing) / 3);

  @media ${QUERIES.tabletAndUp} {
    align-items: flex-start;
  }
`;
