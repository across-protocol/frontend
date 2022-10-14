import styled from "@emotion/styled";
import { useBreadcrumb } from "./useBreadcrumb";
import { ReactComponent as ArrowIcon } from "assets/icons/arrow-16.svg";
import { Link } from "react-router-dom";
import { QUERIESV2 } from "utils";

type BreadcrumbV2Type = {
  onlyRootAncestor?: boolean;
  customCurrentRoute?: string | React.ReactElement;
};

const BreadcrumbV2 = ({
  onlyRootAncestor,
  customCurrentRoute,
}: BreadcrumbV2Type) => {
  const { ancestorRoutes, currentRoute } = useBreadcrumb();

  const definedAncestors =
    onlyRootAncestor && ancestorRoutes.length > 0
      ? [ancestorRoutes[0]]
      : ancestorRoutes;

  const updatedRoute = customCurrentRoute ? (
    customCurrentRoute
  ) : (
    <InactiveLink>{currentRoute.name}</InactiveLink>
  );

  return (
    <Wrapper>
      <BreadcrumbWrapper>
        {definedAncestors.map((route) => (
          <>
            <ActiveLink to={route.path}>{route.name}</ActiveLink>
            <StyledArrowLink />
          </>
        ))}
        {updatedRoute}
      </BreadcrumbWrapper>
      <Divider />
    </Wrapper>
  );
};

export default BreadcrumbV2;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
`;

const Divider = styled.div`
  background: #34353b;
  height: 1px;
  width: 100%;
`;

const BreadcrumbWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

const ActiveLink = styled(Link)`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;

  color: #9daab2;

  text-transform: capitalize;
  text-decoration: none;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 16px;
  }
`;

const InactiveLink = styled.span`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;

  color: #e0f3ff;

  text-transform: capitalize;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 16px;
  }
`;

const StyledArrowLink = styled(ArrowIcon)`
  rotate: -90deg;
`;
