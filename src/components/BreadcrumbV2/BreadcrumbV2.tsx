import styled from "@emotion/styled";
import { useBreadcrumb } from "./useBreadcrumb";
import { ReactComponent as ArrowIcon } from "assets/icons/arrow-16.svg";
import { Link } from "react-router-dom";
import { Text } from "components/Text";
import React from "react";

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
    <InactiveLink size="lg">{currentRoute.name}</InactiveLink>
  );

  return (
    <Wrapper>
      <BreadcrumbWrapper>
        {definedAncestors.map((route) => (
          <React.Fragment key={route.path}>
            <ActiveLink to={route.path}>
              <ActiveLinkText size="lg">{route.name}</ActiveLinkText>
            </ActiveLink>
            <StyledArrowLink />
          </React.Fragment>
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

  width: 100%;
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
  color: #9daab2;

  text-transform: capitalize;
  text-decoration: none;
`;

const ActiveLinkText = styled(Text)`
  color: #9daab2;
`;

const InactiveLink = styled(Text)`
  color: #e0f3ff;
  text-transform: capitalize;
`;

const StyledArrowLink = styled(ArrowIcon)`
  rotate: -90deg;
`;
