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

export const Wrapper = styled.div`
  margin: auto;
  padding: ${64 / 16}rem 0 0;

  @media (max-width: 1024px) {
    padding: ${48 / 16}rem 0 0;
  }

  @media (max-width: 428px) {
    padding: ${32 / 16}rem 0 0;
  }
`;

export const Title = styled.h2`
  margin: 0 ${16 / 16}rem ${16 / 16}rem;
  color: #e0f3ff;
  font-size: ${18 / 16}rem;
  line-height: ${26 / 16}rem;
  font-weight: 400;

  @media (max-width: 428px) {
    font-size: ${16 / 16}rem;
    line-height: ${20 / 16}rem;
  }
`;

export const TableWrapper = styled.div<{ scrollable?: boolean }>`
  border: 1px solid #3e4047;
  border-radius: 8px;
  overflow-x: ${({ scrollable }) => (scrollable ? "auto" : "hidden")};

  ::-webkit-scrollbar {
    height: 0;
  }

  ::-webkit-scrollbar-track {
    background-color: var(--color-gray);
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--color-gray-600);
    border-radius: 6px;
    border: 2px solid #2d2e33;
  }
`;

export const TableHeadRow = styled.div`
  display: flex;
`;

export const TableBody = styled.div``;

export const TableRow = styled.div`
  display: flex;
  position: relative;
  background-color: #2d2e33;
`;

export const TableCell = styled.div`
  padding: ${15 / 16}rem 0 ${15 / 16}rem ${16 / 16}rem;
  flex: 1 1 0;
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;
  color: #e0f3ff;
  white-space: nowrap;
  background-color: #2d2e33;
  border-top: 1px solid #3e4047;

  @media (max-width: 428px) {
    padding: ${13 / 16}rem 0 ${13 / 16}rem ${12 / 16}rem;
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const HeadCell = styled(TableCell)`
  padding: ${10 / 16}rem 0 ${10 / 16}rem ${16 / 16}rem;
  color: #9daab2;
  background-color: #34353b;
  border: none;

  @media (max-width: 428px) {
    padding: ${7 / 16}rem 0 ${7 / 16}rem ${12 / 16}rem;
  }
`;

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
  /* flex: 0 0 130px; */
  min-width: 120px;
`;

export const RewardsHeadCell = styled(HeadCell)`
  /* flex: 0 0 130px; */
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

export const AccordionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const AccordionRow = styled.div`
  display: flex;
  > div {
    padding: 8px 0;
  }
  > div:first-of-type {
    flex: 1 0 60px;
    background-color: var(--color-black);
    border-bottom: 1px solid #2c2f33;
    text-indent: 24px;
  }
  > div:nth-of-type(2) {
    flex: 3 0 130px;
    background: rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid #2c2f33;
    text-indent: 12px;
  }
  &:nth-of-type(6) > div {
    border-bottom: none;
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
  border-top: 1px solid #3e4047;

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

export const EmptyRow = styled.div`
  padding: ${26 / 16}rem ${16 / 16}rem;
  display: flex;
  justify-content: center;
  border-top: 1px solid #3f4047;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;

  @media (max-width: 428px) {
    padding: ${22 / 16}rem ${16 / 16}rem;
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const StyledETHIcon = styled(ETHLogo)``;

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
