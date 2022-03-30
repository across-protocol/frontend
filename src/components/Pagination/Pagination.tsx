import { Wrapper, PaginationElements } from "./Pagination.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const Pagination = () => {
  return (
    <Wrapper>
      <PaginationElements>
        <FontAwesomeIcon icon={faChevronLeft} />
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <FontAwesomeIcon icon={faChevronRight} />
      </PaginationElements>
    </Wrapper>
  );
};

export default Pagination;
