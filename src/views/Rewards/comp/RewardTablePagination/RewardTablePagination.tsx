import {
  Wrapper,
  PaginationElements,
  ElementWrapper,
  NextElement,
  PageSizeSelectWrapper,
  PageSizeSelectButton,
  PageSizeSelectDropdown,
  PageSizeOptiontButton,
  PagesPlaceholder,
} from "./RewardTablePagination.styles";
import { ReactComponent as ArrowIcon } from "assets/icons/arrow-16.svg";
import { useRef, useState } from "react";
import useClickOutsideModal from "hooks/useClickOutsideModal";

interface PageSizeProps {
  onPageSizeChange: (pageSize: number) => void;
  pageSizes: number[];
  pageSize: number;
}

export const PageSizeSelect: React.FC<PageSizeProps> = (props) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutsideModal(ref, () => {
    setShowDropdown(false);
  });

  const onSelectClick = () => {
    setShowDropdown((prevShowDropdown) => !prevShowDropdown);
  };

  const onChangePageSize = (value: number) => {
    setShowDropdown(false);
    props.onPageSizeChange(value);
  };

  return (
    <PageSizeSelectWrapper ref={ref}>
      <PageSizeSelectButton onClick={onSelectClick}>
        {`${props.pageSize} results`}
        <ArrowIcon />
      </PageSizeSelectButton>
      {showDropdown && (
        <PageSizeSelectDropdown>
          {props.pageSizes.map((s) => (
            <PageSizeOptiontButton
              onClick={() => {
                onChangePageSize(s);
              }}
            >{`${s} results`}</PageSizeOptiontButton>
          ))}
        </PageSizeSelectDropdown>
      )}
    </PageSizeSelectWrapper>
  );
};

interface Props {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSize: number;
  pageSizes: number[];
  currentPage: number;
  pageList: number[];
  activeIndex: number;
  disableBack: boolean;
  disableForward: boolean;
  hideStart: boolean;
  hideEnd: boolean;
  lastPage: number;
}

export const Pagination = ({
  onPageChange,
  onPageSizeChange,
  pageList,
  activeIndex,
  disableBack,
  disableForward,
  hideStart,
  hideEnd,
  lastPage,
  currentPage,
  pageSize,
  pageSizes,
}: Props) => {
  return (
    <Wrapper>
      <PageSizeSelect
        pageSize={pageSize}
        pageSizes={pageSizes}
        onPageSizeChange={onPageSizeChange}
      />
      <PaginationElements>
        {!hideStart && (
          <>
            <ElementWrapper onClick={() => onPageChange(0)}> 1 </ElementWrapper>
            &nbsp; ... &nbsp;
          </>
        )}
        {pageList.map((page, index) => {
          return (
            <ElementWrapper
              active={index === activeIndex}
              key={page}
              onClick={() => onPageChange(page)}
            >
              {page + 1}
            </ElementWrapper>
          );
        })}
        {!hideEnd && (
          <>
            <PagesPlaceholder>...</PagesPlaceholder>
            <ElementWrapper onClick={() => onPageChange(lastPage)}>
              {lastPage + 1}
            </ElementWrapper>
          </>
        )}
        <NextElement
          disabled={disableBack}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ArrowIcon />
        </NextElement>
        <NextElement
          disabled={disableForward}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ArrowIcon />
        </NextElement>
      </PaginationElements>
    </Wrapper>
  );
};

export default Pagination;
