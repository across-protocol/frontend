import {
  Wrapper,
  PaginationElements,
  ElementWrapper,
  NextElement,
} from "./Pagination.styles";
import { ReactComponent as LeftIcon } from "assets/pagination-left-arrow.svg";
import { ReactComponent as RightIcon } from "assets/pagination-right-arrow.svg";

// interface Props {
//   elements: any[];
//   totalPerPage: number;
//   currentPage: number;
//   setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
//   numOnPage?: number;
// }

// const Pagination: React.FC<Props> = ({
//   currentPage,
//   setCurrentPage,
//   elements,
//   totalPerPage,
//   numOnPage = 6,
// }) => {
//   const { maxPage, pagesToCreate } = usePagination(
//     elements.length,
//     totalPerPage
//   );

//   return (
//     <Wrapper>
//       <PaginationElements>
//         <ElementWrapper
//           onClick={() => setCurrentPage((pv) => (pv <= 0 ? 0 : pv - 1))}
//         >
//           <FontAwesomeIcon icon={faChevronLeft} />
//         </ElementWrapper>
//         {pagesToCreate.length > 0 &&
//           pagesToCreate.length < numOnPage &&
//           pagesToCreate.map((el, i) => {
//             return (
//               <ElementWrapper
//                 active={currentPage === i}
//                 key={i}
//                 onClick={() => setCurrentPage(el - 1)}
//               >
//                 {el}
//               </ElementWrapper>
//             );
//           })}
//         {pagesToCreate.length >= 6 &&
//           pagesToCreate.map((el, i) => {
//             if (
//               i - currentPage < numOnPage &&
//               i - currentPage >= 0 &&
//               maxPage - currentPage + 1 > numOnPage
//             ) {
//               return (
//                 <ElementWrapper
//                   active={currentPage === i}
//                   key={i}
//                   onClick={() => setCurrentPage(el - 1)}
//                 >
//                   {el}
//                 </ElementWrapper>
//               );
//             }
//             if (
//               maxPage - currentPage >= 0 &&
//               maxPage - currentPage <= numOnPage &&
//               maxPage - i <= numOnPage
//             ) {
//               return (
//                 <ElementWrapper
//                   active={currentPage === i}
//                   key={i}
//                   onClick={() => setCurrentPage(el - 1)}
//                 >
//                   {el}
//                 </ElementWrapper>
//               );
//             }
//             return null;
//           })}
//         <ElementWrapper
//           onClick={() =>
//             setCurrentPage((pv) => (pv >= maxPage ? maxPage : pv + 1))
//           }
//         >
//           <FontAwesomeIcon icon={faChevronRight} />
//         </ElementWrapper>
//       </PaginationElements>
//     </Wrapper>
//   );
// };

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
