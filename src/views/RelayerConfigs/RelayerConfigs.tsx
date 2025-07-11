import styled from "@emotion/styled";
import { LayoutV2, Text } from "components";
import { QUERIESV2 } from "utils";
import ConfigsTable from "./components/ConfigsTable";
import { useRelayerConfigs } from "./hooks/useRelayerConfigs";
import OrderBook from "./components/OrderBook";

const RelayerConfigs = () => {
  const { data: relayerConfigsData } = useRelayerConfigs();

  if (!relayerConfigsData) {
    return null;
  }

  return (
    <LayoutV2 maxWidth={1028}>
      <Wrapper>
        <OrderBook />

        <Text>Relayer Configs</Text>
        {relayerConfigsData && <ConfigsTable data={relayerConfigsData} />}
      </Wrapper>
    </LayoutV2>
  );
};

const Wrapper = styled.div`
  background-color: transparent;

  width: 100%;

  margin: 48px auto 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media ${QUERIESV2.sm.andDown} {
    margin: 16px auto;
    gap: 16px;
  }
`;

export default RelayerConfigs;
