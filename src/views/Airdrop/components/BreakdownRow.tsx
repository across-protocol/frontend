import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Text } from "components/Text";
import { formatUnits } from "utils/format";

type Props = {
  label: string | React.ReactElement;
  Icon?: React.ReactElement;
  amount?: string;
  amountColor?: string;
};

export const BreakdownRow = ({
  Icon,
  label,
  amount = "0",
  amountColor,
}: Props) => {
  const isEligible = BigNumber.from(amount).gt(0);
  return (
    <Container>
      {Icon}
      <Text size="lg">{label}</Text>
      <Amount
        size="lg"
        color={isEligible ? amountColor || "white-100" : "white-70"}
      >
        {isEligible ? `${formatUnits(amount, 18)} ACX` : "-"}
      </Amount>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
`;

const Amount = styled(Text)`
  flex: 1;
  display: flex;
  justify-content: flex-end;
`;
