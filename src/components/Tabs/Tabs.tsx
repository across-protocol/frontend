import React, { FC, useState, ReactElement } from "react";
import Tab from "./Tab";
import { TabList } from "./Tabs.styled";
import { TabProps } from "./Tab";
interface Props {
  children: Array<ReactElement<TabProps>>;
}

const Tabs: FC<Props> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>(
    children[0].props["data-label"]
  );

  const onClickTabItem = (tab: string) => {
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
