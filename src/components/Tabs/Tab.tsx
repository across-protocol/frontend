import React, { FC } from "react";
import { TabListItem } from "./Tabs.styled";

export interface TabProps {
  activeTab: string;
  "data-label": string;
  onClick: (tab: string) => void;
}

export interface ITab {
  label: string;
  element: JSX.Element;
}

const Tab: FC<TabProps> = ({ onClick, "data-label": label, activeTab }) => {
  const changeLabel = () => {
    onClick(label);
  };

  let className = "";

  if (activeTab === label) {
    className = "tab-active";
  }

  return (
    <TabListItem
      id={`${label}Tab`}
      className={className}
      onClick={changeLabel}
      data-cy={`${label.toLowerCase()}-tab`}
    >
      {label}
    </TabListItem>
  );
};

export default Tab;
