import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { ReactComponent as ArrowIcon } from "assets/icons/chevron-right.svg";
import { QUERIESV2 } from "utils";
import { Text } from "components/Text";

type SectionWrapperType = {
  title: string;
  link?: {
    href: string;
    name: string;
  };
  id?: string;
};

const SectionWrapper: React.FC<SectionWrapperType> = ({
  children,
  title,
  link,
  id,
}) => (
  <Wrapper id={id}>
    <TopWrapper>
      <Title>{title}</Title>
      {link && (
        <LinkWrapper to={link.href}>
          <StyledText>{link.name}</StyledText>
          <ArrowIcon />
        </LinkWrapper>
      )}
    </TopWrapper>
    {children}
  </Wrapper>
);

export default SectionWrapper;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;

  width: 100%;
`;

const TopWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  padding: 0px 16px;

  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    padding: 0px 12px;
  }
`;

const Title = styled(Text)`
  color: #9daab2;
`;

const LinkWrapper = styled(Link)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;

  width: fit-content;
  text-decoration: none;

  @media ${QUERIESV2.sm.andDown} {
    & svg {
      height: 16px;
      width: 16px;
    }
  }
`;

const StyledText = styled(Text)`
  color: #9daab2;
  font-style: normal;

  text-decoration: none;
`;
