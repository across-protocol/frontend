import { useState } from "react";

import { Wrapper, Tabs, Tab } from "./StakingForm.styles";
export const StakingForm = () => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <Wrapper>
      <Tabs>
        <Tab onClick={() => setActiveTab(0)} active={activeTab === 0}>
          Stake
        </Tab>
        <Tab onClick={() => setActiveTab(1)} active={activeTab === 1}>
          Unstake
        </Tab>
      </Tabs>
    </Wrapper>
  );
};

export default StakingForm;
