import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { ReactComponent as ArrowIcon } from "assets/icons/arrow-right-16.svg";
import { QUERIESV2 } from "utils";

type SectionWrapperType = {
  title: string;
  link?: {
    href: string;
    name: string;
  };
};

const SectionWrapper: React.FC<SectionWrapperType> = ({
  children,
  title,
  link,
}) => (
  <Wrapper>
    <TopWrapper>
      <Title>{title}</Title>
      {link && (
        <LinkWrapper to={link.href}>
          {link.name} <ArrowIcon />
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

const Title = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: #9daab2;
`;

const LinkWrapper = styled(Link)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;

  width: fit-content;

  color: #9daab2;
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;

  text-decoration: none;
  text-transform: capitalize;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 14px;
    line-height: 18px;

    & svg {
      height: 16px;
      width: 16px;
    }
  }
`;
