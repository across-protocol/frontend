import styled from "@emotion/styled";
import { LayoutV2 } from "components";
import ExternalCardWrapper from "components/CardWrapper";
import { Text } from "components/Text";
import { RowWrapper, Wrapper } from "./Bridge.styles";
import Breadcrumb from "./components/Breadcrumb";
import SlippageAlert from "./components/SlippageAlert";

const Bridge = () => (
  <LayoutV2 maxWidth={600}>
    <Wrapper>
      <Breadcrumb />
      <CardWrapper>
        <RowWrapper>
          <Text size="md" color="grey-400">
            Send
          </Text>
        </RowWrapper>
        <RowWrapper>
          <Text size="md" color="grey-400">
            From
          </Text>
        </RowWrapper>
        <RowWrapper>
          <Text size="md" color="grey-400">
            To
          </Text>
        </RowWrapper>
      </CardWrapper>
      <CardWrapper>
        <SlippageAlert />
      </CardWrapper>
    </Wrapper>
  </LayoutV2>
);

export default Bridge;

const CardWrapper = styled(ExternalCardWrapper)`
  width: 100%;
`;
