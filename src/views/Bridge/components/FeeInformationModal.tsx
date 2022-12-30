import styled from "@emotion/styled";
import { Modal } from "components";
import { Text } from "components/Text";

type FeeInformationModalProps = {
  displayModal: boolean;
  displayModalCloseHandler: () => void;
};

const FeeInformationModal = ({
  displayModal,
  displayModalCloseHandler,
}: FeeInformationModalProps) => (
  <Modal
    title="Information"
    exitModalHandler={displayModalCloseHandler}
    isOpen={displayModal}
    width={500}
    height={900}
    exitOnOutsideClick
  >
    <Wrapper>
      <InnerWrapper>
        <Text size="md" color="white" weight={800}>
          Time to Destination
        </Text>
        <Text size="sm" color="white" weight={300}>
          The estimated amount of time expected to receive your funds. If you do
          not receive your funds within the estimated amount of time, please
          visit theacross-support channel within the{" "}
          <ExternalLink href="https://discord.gg/across">
            Across Discord
          </ExternalLink>
          .
        </Text>
      </InnerWrapper>
      <InnerWrapper>
        <Text size="md" color="white" weight={800}>
          Destination Gas Fee
        </Text>
        <Text size="sm" color="white" weight={300}>
          In order for Across to deliver the tokens to the user on the
          destination chain, a transaction needs to be submitted on behalf of
          the user on the destination chain. The destination gas fee encompasses
          the gas costs associated with this transaction.
        </Text>
      </InnerWrapper>
      <InnerWrapper>
        <Text size="md" color="white" weight={800}>
          Bridge Fee
        </Text>
        <Text size="sm" color="white" weight={300}>
          The bridge fee paid by the user consists of two components:
          <br />
          <br />
          1. LP fee: A fee that is paid to liquidity providers for providing
          passive liquidity in the unified L1 pools
          <br />
          2. Relayer fee: A fee that is paid to bridge relayers to incentivize
          them to promptly relay a bridge transaction.
          <br />
          <br />
          Click{" "}
          <ExternalLink href="https://docs.across.to/how-across-works/overview">
            here
          </ExternalLink>{" "}
          to learn more about the role of relayers
          <br />
          Click{" "}
          <ExternalLink href="https://docs.across.to/how-across-works/fees">
            here
          </ExternalLink>{" "}
          for more information about fees
          <br />
          Click{" "}
          <ExternalLink href="https://ethereum.org/en/developers/docs/gas/">
            here
          </ExternalLink>{" "}
          to learn more about gas fees
        </Text>
      </InnerWrapper>
    </Wrapper>
  </Modal>
);

export default FeeInformationModal;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InnerWrapper = styled.article`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ExternalLink = styled.a`
  color: inherit;
`;
