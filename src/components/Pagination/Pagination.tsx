import {
  Wrapper,
  PaginationElements,
  ElementWrapper,
  NextElement,
} from "./Pagination.styles";
import { ReactComponent as LeftIcon } from "assets/pagination-left-arrow.svg";
import { ReactComponent as RightIcon } from "assets/pagination-right-arrow.svg";

interface Props {
  onPageChange: (page: number) => void;
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
  pageList,
  activeIndex,
  disableBack,
  disableForward,
  hideStart,
  hideEnd,
  lastPage,
  currentPage,
}: Props) => {
  return (
    <Wrapper>
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
            &nbsp; ... &nbsp;
            <ElementWrapper onClick={() => onPageChange(lastPage)}>
              {lastPage + 1}
            </ElementWrapper>
          </>
        )}
        <NextElement
          disabled={disableBack}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <LeftIcon />
        </NextElement>
        <NextElement
          disabled={disableForward}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <RightIcon />
        </NextElement>
      </PaginationElements>
    </Wrapper>
  );
};

export default Pagination;
