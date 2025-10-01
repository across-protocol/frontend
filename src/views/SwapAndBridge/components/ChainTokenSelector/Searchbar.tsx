import styled from "@emotion/styled";
import { ReactComponent as SearchIcon } from "assets/icons/search.svg";
import { ReactComponent as ProductIcon } from "assets/icons/product.svg";

type Props = {
  searchTopic: string;
  search: string;
  setSearch: (search: string) => void;
  className?: string;
};

export default function Searchbar({
  searchTopic,
  search,
  setSearch,
  className,
}: Props) {
  return (
    <Wrapper className={className}>
      <StyledSearchIcon />
      <Input
        placeholder={`Search ${searchTopic}s`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search ? <StyledProductIcon onClick={() => setSearch("")} /> : <div />}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  height: 44px;
  padding: 0px 12px;
  align-items: center;
  gap: 8px;

  flex-direction: row;
  justify-content: space-between;

  border-radius: 8px;
  background: rgba(224, 243, 255, 0.05);

  width: 100%;
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
  color: var(--Base-bright-gray, #e0f3ff);
  text-overflow: ellipsis;

  &::placeholder {
    color: #e0f3ff4d;
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
