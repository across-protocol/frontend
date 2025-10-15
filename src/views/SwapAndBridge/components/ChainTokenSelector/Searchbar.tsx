import styled from "@emotion/styled";
import { ReactComponent as SearchIcon } from "assets/icons/search.svg";
import { ReactComponent as ProductIcon } from "assets/icons/product.svg";
import { COLORS } from "utils";
import React from "react";

type Props = {
  searchTopic: string;
  search: string;
  setSearch: (search: string) => void;
  className?: string;
  inputProps?: React.ComponentPropsWithoutRef<"input">;
};

export const Searchbar = ({
  searchTopic,
  search,
  setSearch,
  className,
  inputProps,
}: Props) => {
  return (
    <Wrapper className={className}>
      <StyledSearchIcon />
      <Input
        id={`search-${searchTopic}`}
        name={`search-${searchTopic}`}
        placeholder={`Search ${searchTopic}s`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        {...inputProps}
      />
      {search ? <StyledProductIcon onClick={() => setSearch("")} /> : <div />}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  height: 44px;
  padding: 0px 12px;
  align-items: center;
  gap: 8px;
  flex-direction: row;
  justify-content: space-between;
  border: 2px solid transparent;

  border-radius: 8px;
  background: transparent;

  width: 100%;

  &:hover,
  &:active {
    background: rgba(224, 243, 255, 0.05);
  }
  &:has(:focus-visible) {
    border-color: ${COLORS.aqua};
  }

  &:focus-within {
    background: rgba(224, 243, 255, 0.1);
  }
`;

const StyledSearchIcon = styled(SearchIcon)`
  width: 20px;
  height: 20px;

  flex-grow: 0;
`;

const StyledProductIcon = styled(ProductIcon)`
  width: 16px;
  height: 16px;

  cursor: pointer;

  flex-grow: 0;
`;

const Input = styled.input`
  overflow: hidden;
  color: var(--base-bright-gray, #e0f3ff);
  text-overflow: ellipsis;

  &::placeholder {
    color: #e0f3ff4d;
  }

  &:hover,
  &:active,
  &:focus-visible {
    color: ${COLORS.aqua};
  }

  background: transparent;

  border: none;
  outline: none;

  width: 100%;

  /* Body/Medium */
  font-family: Barlow;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 20.8px */
`;
