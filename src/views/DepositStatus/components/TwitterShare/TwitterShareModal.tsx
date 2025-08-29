import styled from "@emotion/styled";
import { Text } from "components";
import Modal from "components/Modal";
import { ModalProps } from "components/Modal/Modal";
import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import { QUERIES } from "utils";

type TwitterShareModalProps = ModalProps & {};

export function TwitterShareModal(props: TwitterShareModalProps) {
  const { isMobile } = useCurrentBreakpoint();
  return (
    <Modal
      height={464}
      width={800}
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
      <ModalContent>Modal Content</ModalContent>
    </Modal>
  );
}

const ModalContent = styled.div`
  --spacing: 24px;
  width: 100%;
  padding: var(--spacing);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing);

  @media ${QUERIES.tabletAndUp} {
    flex-direction: row;
  }
`;

const TextColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
