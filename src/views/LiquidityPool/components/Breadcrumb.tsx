import styled from "@emotion/styled";
import BreadcrumbV2 from "components/BreadcrumbV2";
import { ReactComponent as BridgeIcon } from "assets/icons/bridge-with-bg-32.svg";
import { Text } from "components/Text";

export function Breadcrumb() {
  return (
    <BreadcrumbV2
      customCurrentRoute={
        <Wrapper>
          <BridgeIcon />
          <Text size="lg">Pool</Text>
        </Wrapper>
      }
    />
  );
}

export default Breadcrumb;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
`;
