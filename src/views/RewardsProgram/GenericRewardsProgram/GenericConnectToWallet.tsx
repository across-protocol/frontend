import styled from "@emotion/styled";
import { SecondaryButton, Text } from "components";
import { useConnection } from "hooks";
import BackgroundUrl from "assets/bg-banners/transparent-banner.svg";
import { COLORS } from "utils";

type GenericConnectToWalletProps = {
  programName: string;
};

const GenericConnectToWallet = ({
  programName,
}: GenericConnectToWalletProps) => {
  const { connect } = useConnection();
  return (
    <Wrapper>
      <Text size="lg" color="grey-400">
        Connect a wallet to see {programName} transfers
      </Text>
      <SecondaryButton
        size="md"
        onClick={() => {
          connect({ trackSection: "referralTable" });
        }}
      >
        Connect wallet
      </SecondaryButton>
    </Wrapper>
  );
};

export default GenericConnectToWallet;

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
