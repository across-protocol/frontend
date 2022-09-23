import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";

import ethLogo from "assets/ethereum-logo.svg";
import wethLogo from "assets/weth-logo.svg";
import emptyClouds from "assets/across-emptystate-clouds.svg";

import {
  Wrapper,
  Title,
  BottomRow,
  TopRow,
  LoadingWrapper,
  EthNoteWrapper,
  TableWrapper,
  NotFoundWrapper,
  TitleContainer,
} from "../Transactions.styles";
import { TableSwitch } from "./TableSwitch";

type Props = {
  showNoTransactionsFound: boolean;
  showPendingTransactions: boolean;
  showFilledTransactions?: boolean;
  showLoading: boolean;
  ethNoteWrapperText: string;
  TitleContent: React.ReactElement | string;
  TopRowButton?: React.ReactElement;
  PendingTransactionsTable: React.ReactElement;
  FilledTransactionsTable: React.ReactElement;
};

export function TransactionsLayout({
  showLoading,
  showNoTransactionsFound,
  showPendingTransactions,
  showFilledTransactions = true,
  ethNoteWrapperText,
  TitleContent,
  TopRowButton,
  PendingTransactionsTable,
  FilledTransactionsTable,
}: Props) {
  return (
    <Wrapper>
      <TopRow dark={showPendingTransactions}>
        <TitleContainer>
          <Title>{TitleContent}</Title>
          <TableSwitch />
        </TitleContainer>
        {TopRowButton}
        {showPendingTransactions && (
          <>
            <EthNoteWrapper>
              <img src={ethLogo} alt="ethereum_logo" />
              <img src={wethLogo} alt="weth_logo" />
              <span>{ethNoteWrapperText}</span>
            </EthNoteWrapper>
            <TableWrapper>{PendingTransactionsTable}</TableWrapper>
          </>
        )}
      </TopRow>
      {showFilledTransactions && (
        <>
          <BottomRow>
            {showLoading ? (
              <LoadingWrapper>
                <FontAwesomeIcon
                  icon={faCircleNotch}
                  className="fa-spin"
                  size="2x"
                />
                <div>Loading...</div>
              </LoadingWrapper>
            ) : showNoTransactionsFound ? (
              <NotFoundWrapper>
                <img src={emptyClouds} alt="empty_state" />
                No transactions found.
              </NotFoundWrapper>
            ) : (
              <TableWrapper>{FilledTransactionsTable}</TableWrapper>
            )}
          </BottomRow>
        </>
      )}
    </Wrapper>
  );
}
