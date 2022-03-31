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

const Pagination = () => {
  return (
    <Wrapper>
      <PaginationElements>
        <ElementWrapper>
          <FontAwesomeIcon icon={faChevronLeft} />
        </ElementWrapper>
        <ElementWrapper>1</ElementWrapper>
        <ElementWrapper>2</ElementWrapper>
        <ElementWrapper>3</ElementWrapper>
        <ElementWrapper>
          <FontAwesomeIcon icon={faChevronRight} />
        </ElementWrapper>
      </PaginationElements>
    </Wrapper>
  );
};

export default Pagination;
