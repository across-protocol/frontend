import styled from "@emotion/styled";
import { Text } from "components/Text";
import { IconPair } from "components/IconPair";

type Props = {
  leftIcon: string;
  leftAlt: string;
  rightIcon: string;
  rightAlt: string;
  label: string;
};

export function IconPairDisplay({
  leftIcon,
  leftAlt,
  rightIcon,
  rightAlt,
  label,
}: Props) {
  return (
    <InfoRow>
      <IconPair
        LeftIcon={<img src={leftIcon} alt={leftAlt} />}
        RightIcon={<img src={rightIcon} alt={rightAlt} />}
        iconSize={32}
      />
      <Text color="light-200" size="lg">
        {label}
      </Text>
    </InfoRow>
  );
}

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;
