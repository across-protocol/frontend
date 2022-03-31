import {
  Wrapper,
  PaginationElements,
  ElementWrapper,
} from "./Pagination.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import usePagination from "./usePagination";

interface Props {
  elements: any[];
  totalPerPage: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  numOnPage?: number;
}

const Pagination: React.FC<Props> = ({
  currentPage,
  setCurrentPage,
  elements,
  totalPerPage,
  numOnPage = 6,
}) => {
  const { maxPage, pagesToCreate } = usePagination(
    elements.length,
    totalPerPage
  );

  return (
    <Wrapper>
      <PaginationElements>
        <ElementWrapper
          onClick={() => setCurrentPage((pv) => (pv <= 0 ? 0 : pv - 1))}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </ElementWrapper>
        {/* Show 6 numbers on page */}
        {pagesToCreate.length > 0 &&
          pagesToCreate.length < numOnPage &&
          pagesToCreate.map((el, i) => {
            return (
              <ElementWrapper
                active={currentPage === i}
                key={i}
                onClick={() => setCurrentPage(el - 1)}
              >
                {el}
              </ElementWrapper>
            );
          })}
        {pagesToCreate.length >= 6 &&
          pagesToCreate.map((el, i) => {
            if (
              i - currentPage < numOnPage &&
              i - currentPage >= 0 &&
              maxPage - currentPage + 1 > numOnPage
            ) {
              return (
                <ElementWrapper
                  active={currentPage === i}
                  key={i}
                  onClick={() => setCurrentPage(el - 1)}
                >
                  {el}
                </ElementWrapper>
              );
            }
            if (
              maxPage - currentPage >= 0 &&
              maxPage - currentPage <= numOnPage &&
              maxPage - i <= numOnPage
            ) {
              return (
                <ElementWrapper
                  active={currentPage === i}
                  key={i}
                  onClick={() => setCurrentPage(el - 1)}
                >
                  {el}
                </ElementWrapper>
              );
            }
            return null;
          })}
        <ElementWrapper
          onClick={() =>
            setCurrentPage((pv) => (pv >= maxPage ? maxPage : pv + 1))
          }
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </ElementWrapper>
      </PaginationElements>
    </Wrapper>
  );
};

export default Pagination;
