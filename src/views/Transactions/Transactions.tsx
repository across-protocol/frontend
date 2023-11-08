import styled from "@emotion/styled";
import { useState } from "react";

import { Text } from "components/Text";
import Footer from "components/Footer";
import { COLORS } from "utils";

import { FilterDropdown } from "./components/FilterDropdown";
import { PersonalTransactions } from "./components/PersonalTransactions";
import { AllTransactions } from "./components/AllTransactions";
import { DepositStatusFilter } from "./types";

const statusFilterOptions: DepositStatusFilter[] = ["all", "pending", "filled"];

export function Transactions() {
  const [activeTab, setActiveTab] = useState<"personal" | "all">("personal");
  const [statusFilter, setStatusFilter] = useState<DepositStatusFilter>(
    statusFilterOptions[0]
  );

  return (
    <Wrapper>
      <Text size="lg" color="light-200">
        Transactions
      </Text>
      <Divider />
      <FilterWrapper>
        <TabWrapper>
          <Tab
            onClick={() => setActiveTab("personal")}
            active={activeTab === "personal"}
          >
            Personal
          </Tab>
          <Tab onClick={() => setActiveTab("all")} active={activeTab === "all"}>
            All
          </Tab>
        </TabWrapper>
        <FilterDropdown
          filterLabel="Status"
          filterOptions={statusFilterOptions}
          selectedFilter={statusFilter}
          onSelectFilter={(filter) =>
            setStatusFilter(filter as DepositStatusFilter)
          }
        />
      </FilterWrapper>
      <BodyWrapper>
        {activeTab === "personal" ? (
          <PersonalTransactions statusFilter={statusFilter} />
        ) : (
          <AllTransactions statusFilter={statusFilter} />
        )}
      </BodyWrapper>
      <Footer />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 1142px;
  margin: 0 auto;
  margin-top: 32px;
  display: flex;
  flex-direction: column;

  @media (max-width: 1142px) {
    padding: 0 16px;
  }
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${COLORS["black-700"]};
  margin-top: 12px;
  margin-bottom: 24px;
`;

const Tab = styled.div<{ active?: boolean }>`
  display: flex;
  height: 48px;
  padding: 0px 16px;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  border-bottom: ${({ active }) =>
    active ? `2px solid ${COLORS["light-200"]}` : "none"};

  color: ${({ active }) => (active ? COLORS["light-200"] : COLORS["grey-400"])};
`;

const FilterWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  border-bottom: 1px solid ${COLORS["grey-600"]};
  margin-bottom: 24px;
`;

const TabWrapper = styled.div`
  display: flex;
  flex-direction: row;

  gap: 16px;
`;

const BodyWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  margin-bottom: 64px;
`;
