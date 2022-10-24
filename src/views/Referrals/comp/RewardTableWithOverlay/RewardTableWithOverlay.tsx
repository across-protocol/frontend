import { RewardTable, ConnectTableOverlay } from "..";
import createMyReferralsTableJSX, {
  headers,
} from "../RewardTable/createMyReferralsTableJSX";
import { Wrapper } from "./RewardTableWithOverlay.styles";
import { Referral } from "hooks/useReferrals";
import Pagination from "components/Pagination";
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
  totalReferralCount: number;
}> = ({
  isConnected,
  referrals,
  account,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  pageSizes,
  totalReferralCount,
}) => {
  const rows = createMyReferralsTableJSX(referrals, isConnected, account);

  const paginateState = paginate({
    elementCount: totalReferralCount,
    currentPage,
    maxNavigationCount: 5,
    elementsPerPage: pageSize,
  });

  const paginatedRows = rows;

  return (
    <Wrapper>
      {!isConnected ? <ConnectTableOverlay /> : null}
      <RewardTable
        scrollable={rows.length > 0 && isConnected}
        rows={paginatedRows}
        headers={headers}
        emptyMessage="You have no referral transfers yet"
      />
      {isConnected && (
        <div>
          <Pagination
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
            pageSizes={pageSizes}
            onPageChange={setCurrentPage}
            {...paginateState}
          />
        </div>
      )}
    </Wrapper>
  );
};

export default RewardTableWithOverlay;
