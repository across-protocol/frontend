import styled from "@emotion/styled";
import { ReactNode, useState } from "react";

import { Text } from "components/Text";
import closeIcon from "assets/icons/cross.svg";
import { ReactComponent as ChevronDown } from "assets/icons/chevron-down.svg";
import { useSidebarContext } from "hooks/useSidebarContext";
import { Link } from "react-router-dom";
import { COLORS } from "utils";

export const SidebarItem = {
  Header,
  MenuItem,
  InternalLink,
  ExternalLink,
  Collapsible,
};

function Header(props: { title: string; children?: ReactNode }) {
  const { closeSidebar } = useSidebarContext();
  return (
    <HeaderContainer>
      <HeaderTitleRow>
        <Text color="light-300">{props.title}</Text>
        <HeaderCloseButton onClick={closeSidebar}>
          <img src={closeIcon} alt="close_button" />
        </HeaderCloseButton>
      </HeaderTitleRow>
      <HeaderContentContainer>{props.children}</HeaderContentContainer>
    </HeaderContainer>
  );
}

function MenuItem(props: {
  label: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  dataCy?: string;
}) {
  return (
    <MenuItemContainer
      onClick={props.disabled ? undefined : props.onClick}
      disabled={props.disabled}
      data-cy={`sidebar-menu-item-${props.dataCy}`}
    >
      <LeftIconContainer>
        {props.leftIcon && props.leftIcon}
        <Text color="light-300">{props.label}</Text>
      </LeftIconContainer>
      {props.rightIcon && props.rightIcon}
    </MenuItemContainer>
  );
}

function InternalLink(props: {
  onClick: () => void;
  label: string;
  path: string;
}) {
  return (
    <InternalLinkContainer to={props.path}>
      <MenuItem onClick={props.onClick} label={props.label} />
    </InternalLinkContainer>
  );
}

function ExternalLink(props: {
  onClick: () => void;
  label: string;
  linkTo: string;
  rightIcon?: ReactNode;
}) {
  return (
    <ExternalLinkContainer href={props.linkTo} target="_blank" rel="noreferrer">
      <MenuItem
        onClick={props.onClick}
        label={props.label}
        rightIcon={props.rightIcon}
      />
    </ExternalLinkContainer>
  );
}

function Collapsible(props: {
  label: string;
  items: {
    label: string;
    href: string;
  }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <MenuItem
        onClick={() => setIsOpen((prev) => !prev)}
        label={props.label}
        rightIcon={isOpen ? <ChevronUp /> : <ChevronDown />}
      />
      {isOpen && (
        <CollapsibleChildItemsContainer>
          {props.items.map((item) => (
            <ExternalLink
              key={item.href}
              onClick={() => setIsOpen(true)}
              label={item.label}
              linkTo={item.href}
            />
          ))}
        </CollapsibleChildItemsContainer>
      )}
    </>
  );
}

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderTitleRow = styled.div`
  display: flex;
  padding: 24px 24px 18px 24px;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;
`;

const HeaderCloseButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;

  svg path {
    width: 24px;
    height: 24px;
    fill: #e0e0e0;
  }
`;

const HeaderContentContainer = styled.div`
  display: flex;
  padding: 0px 24px;
  flex-direction: column;
`;

const MenuItemContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 18px 24px;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  border-bottom: 0.5px solid ${COLORS["grey-400-15"]};
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover {
    background-color: ${({ disabled }) =>
      disabled ? "transparent" : "#2b2b2f"};
  }

  a {
    text-decoration: none;
  }

  svg path {
    height: 32px;
    width: 32px;
  }
`;

const LeftIconContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const CollapsibleChildItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ExternalLinkContainer = styled.a`
  text-decoration: none;
`;

const InternalLinkContainer = styled(Link)`
  width: 100%;
  height: 100%;
  text-decoration: none;
`;

const ChevronUp = styled(ChevronDown)`
  transform: rotate(180deg);
`;
