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
}

const Pagination: React.FC<Props> = ({
  currentPage,
  setCurrentPage,
  elements,
  totalPerPage,
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
        {pagesToCreate.map((el, i) => {
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
