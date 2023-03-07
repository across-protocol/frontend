import styled from "@emotion/styled";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { ReactComponent as AcrossPlusIcon } from "assets/across-plus-icon.svg";
import { QUERIES } from "utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { ReactComponent as ETHLogo } from "assets/eth.svg";
import { ReactComponent as UNILogo } from "assets/uni.svg";
import { ReactComponent as USDCLogo } from "assets/usdc.svg";
import { ReactComponent as WETHLogo } from "assets/weth.svg";
import { ReactComponent as BadgerLogo } from "assets/badger.svg";
import { ReactComponent as DaiLogo } from "assets/dai.svg";
import { ReactComponent as UmaLogo } from "assets/uma.svg";
import { ReactComponent as WBTCLogo } from "assets/wbtc.svg";
import { ReactComponent as RightUpArrow } from "assets/across-right-up-arrow.svg";

import ProgressBar from "components/ProgressBar";
import {
  BaseTableWrapper,
  BaseWrapper,
  BaseTitle,
  BaseEmptyRow,
  BaseTableHeadRow,
  BaseTableBody,
  BaseTableRow,
  BaseHeadCell,
  BaseTableCell,
} from "components/Table";

export const Wrapper = BaseWrapper;

export const Title = BaseTitle;

export const TableWrapper = styled(BaseTableWrapper)`
  width: 100%;
  border-radius: 12px;
`;

export const TableBody = BaseTableBody;

export const TableHeadRow = styled(BaseTableHeadRow)`
  background-color: #34353b;
`;

export const TableRow = styled(BaseTableRow)``;

export const EmptyRow = BaseEmptyRow;

export const TableCell = styled(BaseTableCell)`
  border-top: 1px solid #3e4047;
`;

export const HeadCell = styled(BaseHeadCell)``;

export const AssetCell = styled(TableCell)`
  flex: 0 0 172px;
  column-gap: 24px;
  font-weight: 500;
`;

export const AssetHeadCell = styled(HeadCell)`
  flex: 0 0 172px;
`;

export const ChainsCell = styled(TableCell)`
  flex: 0 0 168px;
  flex-direction: column;
  align-items: flex-start;
`;

export const ChainsHeadCell = styled(HeadCell)`
  flex: 0 0 168px;
`;

export const DateCell = styled(TableCell)`
  flex: 0 0 136px;
  flex-direction: column;
  align-items: flex-start;
`;

export const DateHeadCell = styled(HeadCell)`
  flex: 0 0 136px;
`;

export const AddressCell = styled(TableCell)`
  flex: 0 0 136px;
`;

export const AddressHeadCell = styled(HeadCell)`
  flex: 0 0 136px;
`;

export const BridgeFeeCell = styled(TableCell)`
  flex: 0 0 144px;
`;

export const BridgeFeeHeadCell = styled(HeadCell)`
  flex: 0 0 144px;
`;

export const ReferralRateCell = styled(TableCell)`
  flex: 0 0 136px;
`;

export const ReferralRateHeadCell = styled(HeadCell)`
  flex: 0 0 136px;
`;

export const RewardsCell = styled(TableCell)`
  min-width: 120px;
`;

export const RewardsHeadCell = styled(HeadCell)`
  min-width: 202px;
`;

export const TableLogo = styled.img`
  height: 15px;
  margin-right: 4px;
`;

export const TableLink = styled.a`
  color: var(--color-primary);
  &:hover {
    opacity: 0.7;
  }
`;

export const MobileWrapper = styled(Wrapper)`
  width: 100%;
  min-width: 300px;
`;

export const StyledMobileHeadRow = styled(TableCell)`
  width: 100%;
`;

export const StyledMobileRow = styled(TableCell)`
  width: 100%;
  cursor: pointer;
  &:first-of-type {
    margin-bottom: 0px;
  }
  &:not(:first-of-type) {
    margin: 1px 0;
  }
`;

export const MobileTableLink = styled(TableLink)`
  border-bottom: none;
`;

export const PaginationWrapper = styled.div`
  max-width: 1425px;
  margin: auto;

  @media ${QUERIES.mobileAndDown} {
    padding: 0 ${20 / 16}rem;
  }
`;

export const StyledPlus = styled(AcrossPlusIcon)`
  cursor: pointer;
  float: right;
  margin-top: 8px;
  margin-right: 4px;
`;

const StyledCircleInfo = styled(FontAwesomeIcon)`
  path {
    fill: #9daab2;
  }
  margin-left: 4px;
  border: 1px solid #9daab2;
  border-radius: 16px;
`;

export const CircleInfo = () => (
  <StyledCircleInfo icon={faCircleInfo} style={{ color: "white" }} />
);

export const PoolCellValue = styled.div`
  font-weight: bold;
  display: flex;
  column-gap: 16px;
  align-items: center;
  div {
    font-size: 1rem;
    font-weight: 500;
    color: #e0f3ff;
  }
`;

export const MultiplierCellValue = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  column-gap: 16px;
`;

export const MutliplierValue = styled.div`
  font-weight: 500;
  font-size: 1rem;
`;

export const StakeButton = styled(SecondaryButtonWithoutShadow)`
  color: var(--color-primary);
  height: 40px;
  padding: 1rem;
  border: 1px solid var(--color-primary);
  display: flex;
  align-items: center;
  min-width: 100px;
  justify-content: center;
  font-weight: 500;
  &:hover {
    color: #ffffff;
    border: 1px solid #ffffff;
  }
`;

interface IStyledProgressBar {
  className?: string;
}
export const StyledProgressBar = styled(ProgressBar)<IStyledProgressBar>`
  &.pool-progress-bar {
    max-width: 120px;
  }
`;

export const ArrowUpRight = styled(RightUpArrow)``;

export const GrayText = styled.div`
  font-size: ${14 / 16}rem;
  line-height: ${18 / 16}rem;
  color: #9daab2;
`;

export const ExplorerLinkContainer = styled.div<{ disabled?: boolean }>`
  border-top: 1px solid #3e4047;

  position: sticky;
  right: 0;
  flex: 0 0 82px;
  align-self: stretch;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background: linear-gradient(
    to right,
    rgba(45, 46, 51, 0) 0%,
    rgba(45, 46, 51, 1) 30%
  );
  a {
    height: 40px;
    width: 40px;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    border: 1px solid #4c4e57;
    transition: border 0.1s;
    pointer-events: ${({ disabled }) => (disabled ? "none" : "all")};

    :hover {
      border: 1px solid #e0f3ff;

      svg path {
        fill: #e0f3ff;
      }
    }
  }
`;

export const ReferralIconContainer = styled.div`
  margin-left: auto;
  cursor: pointer;
`;

export const StyledETHIcon = styled(ETHLogo)``;
export const StyledPoolIcon = styled.img`
  width: 32px;
  height: 32px;
`;

export const StyledUNILogo = styled(UNILogo)``;
export const StyledUSDCLogo = styled(USDCLogo)``;
export const StyledWETHLogo = styled(WETHLogo)``;
export const StyledDaiLogo = styled(DaiLogo)`
  width: 32px;
  height: 32px;
`;
export const StyledWBTCLogo = styled(WBTCLogo)``;
export const StyledUmaLogo = styled(UmaLogo)``;
export const StyledBadgerLogo = styled(BadgerLogo)``;
