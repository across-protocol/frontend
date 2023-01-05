import styled from "@emotion/styled";
import { Modal } from "components";
import { Text } from "components/Text";
import { ReactComponent as QuestionMarkIcon } from "assets/icons/question-24.svg";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-external-link-16.svg";

type FeeInformationModalProps = {
  displayModal: boolean;
  displayModalCloseHandler: () => void;
};

const links: { text: string; link: string }[] = [
  {
    text: "The role of relayers",
    link: "https://docs.across.to/how-across-works/overview",
  },
  {
    text: "Relayer fees",
    link: "https://docs.across.to/how-across-works/fees",
  },
  {
    text: "Gas fees",
    link: "https://ethereum.org/en/developers/docs/gas/",
  },
];

const FeeInformationModal = ({
  displayModal,
  displayModalCloseHandler,
}: FeeInformationModalProps) => (
  <Modal
    title="Information"
    exitModalHandler={displayModalCloseHandler}
    isOpen={displayModal}
    width={550}
    height={900}
    exitOnOutsideClick
  >
    <Wrapper>
      <InnerWrapperStack>
        <InnerWrapper>
          <Text size="lg" color="white" weight={400}>
            Time to destination
          </Text>
          <Text size="md" color="grey-400" weight={400}>
            The estimated amount of time expected to receive your funds. If you
            do not receive your funds within the estimated amount of time,
            please visit the `across-support channel` within the{" "}
            <ExternalLink href="https://discord.gg/across">
              Across Discord
            </ExternalLink>
            .
          </Text>
        </InnerWrapper>
        <InnerWrapper>
          <Text size="lg" color="white" weight={400}>
            Destination gas fee
          </Text>
          <Text size="md" color="grey-400" weight={400}>
            In order for Across to deliver the tokens to the user on the
            destination chain, a transaction needs to be submitted on behalf of
            the user on the destination chain. The destination gas fee
            encompasses the gas costs associated with this transaction.
          </Text>
        </InnerWrapper>
        <InnerWrapper>
          <Text size="lg" color="white" weight={400}>
            Bridge fee
          </Text>
          <Text size="md" color="grey-400" weight={400}>
            The bridge fee paid by the user consists of two components:
            <br />
            <br />
            <InnerTextWhiteColor>LP fee:</InnerTextWhiteColor> A fee that is
            paid to liquidity providers for providing passive liquidity in the
            unified L1 pools.
            <br />
            <br />
            <InnerTextWhiteColor>Relayer fee:</InnerTextWhiteColor> A fee that
            is paid to bridge relayers to incentivize them to promptly relay a
            bridge transaction.
          </Text>
        </InnerWrapper>
      </InnerWrapperStack>
      <Divider />
      <ExternalLinkContainer>
        {links.map(({ text, link }, idx) => (
          <ExternalLinkWrapper key={idx}>
            <ExternalLinkIconTextContainer>
              <QuestionMarkIcon />
              <Text size="md" color="white">
                {text}
              </Text>
            </ExternalLinkIconTextContainer>
            <ExternalContainerIconLink href={link}>
              <StyledExternalLinkIcon />
            </ExternalContainerIconLink>
          </ExternalLinkWrapper>
        ))}
      </ExternalLinkContainer>
    </Wrapper>
  </Modal>
);

export default FeeInformationModal;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InnerWrapperStack = styled.div`
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
  color: #44d2ff;
`;

const InnerTextWhiteColor = styled.span`
  color: #e0f3ff;
`;

const Divider = styled.div`
  height: 1px;
  background: #2d2e33;
  width: 100%;
`;

const ExternalLinkContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 12px;

  max-width: 500px;
  overflow-x: scroll;
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    /* WebKit */
    width: 0;
    height: 0;
  }
`;

const ExternalLinkIconTextContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 14px;

  width: 100%;
`;

const ExternalLinkWrapper = styled.div`
  flex-shrink: 0;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  gap: 24px;

  background: rgba(68, 210, 255, 0.05);
  border: 1px solid rgba(68, 210, 255, 0.1);
  border-radius: 8px;

  height: 56px;
`;

const StyledExternalLinkIcon = styled(ExternalLinkIcon)`
  height: 32px;
  width: 32px;
  & * {
    stroke: #44d2ff;
  }
`;

const ExternalContainerIconLink = styled.a`
  height: 32px;
  width: 32px;
`;
