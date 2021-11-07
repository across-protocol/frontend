import React, { FC, useState, ReactElement } from "react";
import Tab from "./Tab";
import { TabList } from "./Tabs.styled";
import { TabProps } from "./Tab";
interface Props {
  children: Array<ReactElement<TabProps>>;
  // If you need a default one on mount
  defaultTab?: string;
  // track default Tab if need be
  changeDefaultTab?: (tab: string) => void;
}

const Tabs: FC<Props> = ({ children, defaultTab, changeDefaultTab }) => {
  const [activeTab, setActiveTab] = useState<string>(
    defaultTab ?? children[0].props["data-label"]
  );

  const onClickTabItem = (tab: string) => {
    if (changeDefaultTab) changeDefaultTab(tab);
    setActiveTab(tab);
  };

  return (
    <div>
      <TabList>
        {children.map((child) => {
          return (
            <Tab
              key={child.props["data-label"]}
              activeTab={activeTab}
              data-label={child.props["data-label"]}
              onClick={onClickTabItem}
            />
          );
        })}
      </TabList>
      <div className="tab-content">
        {children.map((child) => {
          if (child.props["data-label"] !== activeTab) return undefined;
          return child;
        })}
      </div>
    </div>
  );
};

export default Tabs;
