import styled from "@emotion/styled";

import BreadcrumbV2 from "components/BreadcrumbV2";
import { Text } from "components/Text";
import { shortenString } from "utils";

type Props = {
  depositTxHash: string;
};

export function Breadcrumb({ depositTxHash }: Props) {
  return (
    <BreadcrumbV2
      customCurrentRoute={
        <Wrapper>
          <Text size="lg">{shortenString(depositTxHash, "..", 4)}</Text>
        </Wrapper>
      }
    />
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
`;
