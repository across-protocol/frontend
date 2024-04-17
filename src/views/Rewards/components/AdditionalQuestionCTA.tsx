import styled from "@emotion/styled";
import { Text } from "components/Text";
import { ReactComponent as ExternalLink16 } from "assets/icons/external-link-16.svg";
import { QUERIESV2 } from "utils";

const LinkButton = ({ text, link }: { text: string; link: string }) => (
  <ButtonWrapper href={link}>
    <Text weight={500}>{text}</Text>
    <ExternalLink16 />
  </ButtonWrapper>
);

const AdditionalQuestionCTA = () => (
  <Wrapper>
    <Text color="white-88">
      Got any questions? Check out our FAQ and Discord.
    </Text>
    <ExternalButtonWrapper>
      <LinkButton
        text="FAQ"
        link="https://docs.across.to/v/user-docs/how-across-works/overview"
      />
      <LinkButton text="Discord" link="https://discord.across.to" />
    </ExternalButtonWrapper>
  </Wrapper>
);

export default AdditionalQuestionCTA;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  width: 100%;

  padding: 0px;
  gap: 24px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    text-align: center;
  }
`;

const ExternalButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
`;

const ButtonWrapper = styled.a`
  border: 1px solid #4c4e57;
  border-radius: 12px;

  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 20px;
  gap: 6px;

  text-decoration: none;
`;
