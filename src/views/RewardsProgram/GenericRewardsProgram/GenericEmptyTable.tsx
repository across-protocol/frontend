import styled from "@emotion/styled";

import BackgroundUrl from "assets/bg-banners/transparent-banner.svg";
import { COLORS } from "utils";
import { SecondaryButton, Text } from "components";

type GenericEmptyTableProps = {
  programName: string;
  isConnected?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  onClickConnect: () => void;
  onClickReload: () => void;
};

const GenericEmptyTable = ({
  programName,
  isConnected,
  isEmpty,
  isError,
  isLoading,
  onClickConnect,
  onClickReload,
}: GenericEmptyTableProps) => {
  if (!isConnected) {
    return (
      <Wrapper>
        <Text size="lg" color="grey-400">
          Connect a wallet to see {programName} transfers
        </Text>
        <SecondaryButton
          size="md"
          data-cy="connect-wallet"
          onClick={onClickConnect}
        >
          Connect wallet
        </SecondaryButton>
      </Wrapper>
    );
  }

  if (isLoading) {
    return (
      <Wrapper>
        <Text size="lg" color="grey-400">
          Loading...
        </Text>
      </Wrapper>
    );
  }

  if (isError) {
    return (
      <Wrapper>
        <Text size="lg" color="grey-400">
          Error loading data
        </Text>
        <SecondaryButton size="md" data-cy="reload" onClick={onClickReload}>
          Reload
        </SecondaryButton>
      </Wrapper>
    );
  }

  if (isEmpty) {
    return (
      <Wrapper data-cy="empty-rewards-table">
        <Text size="lg" color="grey-400">
          No {programName} transfers yet
        </Text>
      </Wrapper>
    );
  }

  return null;
};

export default GenericEmptyTable;

const Wrapper = styled.div`
  display: flex;
  padding: 56px 0px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
  width: 100%;

  background-image: url(${BackgroundUrl});
  border-top: 1px solid ${COLORS["grey-600"]};
`;
