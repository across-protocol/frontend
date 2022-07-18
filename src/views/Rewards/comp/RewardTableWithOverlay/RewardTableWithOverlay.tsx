import { RewardTable, ConnectTableOverlay } from "../";
import createMyReferralsTableJSX, {
  headers,
} from "../RewardTable/createMyReferralsTableJSX";
import { Wrapper } from "./RewardTableWithOverlay.styles";
import { Referral } from "hooks/useReferrals";
import Pagination from "../RewardTablePagination";
import paginate from "components/Pagination/paginate";

const RewardTableWithOverlay: React.FC<{
  isConnected: boolean;
  referrals: Referral[];
  account: string;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: (value: number) => void;
  pageSizes: number[];
}> = ({
  isConnected,
  referrals,
  account,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  pageSizes,
}) => {
  const rows = createMyReferralsTableJSX(referrals, isConnected, account);
  const elementCount = rows.length;

  const paginateState = paginate({
    elementCount,
    currentPage,
    maxNavigationCount: 5,
    elementsPerPage: pageSize,
  });

  const paginatedRows = rows.slice(
    paginateState.startIndex,
    paginateState.endIndex
  );

  return (
    <Wrapper>
      {!isConnected ? <ConnectTableOverlay /> : null}
      <RewardTable
        scrollable={rows.length > 0 && isConnected}
        title="My transfers"
        rows={paginatedRows}
        headers={headers}
      />
      {paginateState.totalPages > 1 ? (
        <div>
          <Pagination
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
            pageSizes={pageSizes}
            onPageChange={setCurrentPage}
            {...paginateState}
          />
        </div>
      ) : null}
    </Wrapper>
  );
};

export default RewardTableWithOverlay;
