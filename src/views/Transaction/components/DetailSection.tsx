import styled from "@emotion/styled";
import { Text } from "components/Text";
import { COLORS } from "utils";

type Props = {
  label: string;
  children: React.ReactNode;
};

export function DetailSection({ label, children }: Props) {
  return (
    <Wrapper>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS["grey-400"]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;
