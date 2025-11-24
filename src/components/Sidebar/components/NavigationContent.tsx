import { useCallback } from "react";

import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-up-right.svg";
import { useSidebarContext } from "hooks/useSidebarContext";
import { AccountContent } from "./AccountContent";
import { SidebarItem } from "./SidebarItem";
import { TermsOfServiceDisclaimer } from "./TermsOfServiceDisclaimer";
import { NAVIGATION_LINKS } from "Routes";

type NavigationLInk = {
  href: string;
  name: string;
  isExternalLink?: boolean;
  rightIcon?: React.ReactNode;
};

const sidebarNavigationLinks: NavigationLInk[] = [
  ...NAVIGATION_LINKS,
  {
    href: "https://docs.across.to/",
    name: "Docs",
    isExternalLink: true,
    rightIcon: <ExternalLinkIcon />,
  },
];

const sidebarAboutLinks = [
  {
    title: "Support (Discord)",
    link: "https://discord.across.to",
    isExternalLink: true,
  },
  {
    title: "Github",
    link: "https://github.com/across-protocol",
    isExternalLink: true,
  },
  {
    title: "Twitter",
    link: "https://twitter.com/AcrossProtocol/",
    isExternalLink: true,
  },
  {
    title: "Medium",
    link: "https://medium.com/across-protocol",
    isExternalLink: true,
  },
  {
    title: "Forum",
    link: "https://forum.across.to/",
    isExternalLink: true,
  },
  {
    title: "Terms of Service",
    link: "https://across.to/terms-of-service",
    isExternalLink: true,
  },
];

export function NavigationContent() {
  const { closeSidebar } = useSidebarContext();

  const handleClickNavLink = useCallback(() => {
    closeSidebar();
  }, [closeSidebar]);

  return (
    <>
      <AccountContent />
      {sidebarNavigationLinks.map((item) =>
        item?.isExternalLink ? (
          <SidebarItem.ExternalLink
            key={item.name}
            onClick={handleClickNavLink}
            label={item.name}
            linkTo={item.href}
            rightIcon={item.rightIcon}
          />
        ) : (
          <SidebarItem.InternalLink
            key={item.name}
            onClick={handleClickNavLink}
            label={item.name}
            path={item.href}
          />
        )
      )}
      <SidebarItem.Collapsible
        label="About"
        items={sidebarAboutLinks.map((item) => ({
          label: item.title,
          href: item.link,
        }))}
      />
      <TermsOfServiceDisclaimer />
    </>
  );
}
