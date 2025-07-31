import styled from "@emotion/styled";
import { useHistory } from "react-router-dom";

import { Banner, SuperHeader, Text } from "components";
import {
  generalMaintenanceMessage,
  WrongNetworkError,
  disableDeposits,
  rewardsBannerWarning,
  showV4LaunchBanner,
} from "utils";
import AcrossV4Banner from "components/Banners/AcrossV4Banner";
import RewardsWarningBanner from "components/Banners/RewardsWarningBanner";

import { ReactComponent as SolanaLogo } from "assets/icons/solana-with-bg.svg";
import { ReactComponent as ArrowRight } from "assets/icons/arrow-right.svg";

const promoteBridgeRoute = process.env.REACT_APP_PROMOTE_BRIDGE_ROUTE;

// Can be enabled by setting the environment variable
// REACT_APP_PROMOTE_BRIDGE_ROUTE=solana
const promotableBridgeRoutes = {
  solana: {
    logo: <SolanaLogo />,
    name: "Solana",
    path: "/solana",
  },
};

export default function Banners({
  networkError,
  onClickNetworkError,
  isContractAddress,
}: {
  networkError?: Error;
  onClickNetworkError: () => void;
  isContractAddress: boolean;
}) {
  const promotedBridgeRoute =
    promotableBridgeRoutes[
      promoteBridgeRoute as keyof typeof promotableBridgeRoutes
    ];
  const shouldShowPromotedBridgeRoute =
    Boolean(promoteBridgeRoute) && Boolean(promotedBridgeRoute);

  const history = useHistory();

  return (
    <>
      {generalMaintenanceMessage && (
        <SuperHeader size="lg">{generalMaintenanceMessage}</SuperHeader>
      )}
      {disableDeposits && (
        <SuperHeader>
          Across is experiencing issues. Deposits are currently disabled into
          the pools. Please try again later
        </SuperHeader>
      )}
      {networkError && !(networkError instanceof WrongNetworkError) && (
        <SuperHeader>
          <div>{networkError.message}</div>
          <RemoveErrorSpan onClick={onClickNetworkError}>X</RemoveErrorSpan>
        </SuperHeader>
      )}
      {rewardsBannerWarning && location.pathname === "/rewards" && (
        <RewardsWarningBanner />
      )}
      {showV4LaunchBanner && <AcrossV4Banner />}
      {isContractAddress && (
        <SuperHeader size="lg">
          We noticed that you have connected from a contract address. We
          recommend that you change the destination of the transfer (by clicking
          the "Change account" text below the To dropdown) to a non-contract
          wallet you control on the destination chain to avoid having your funds
          lost or stolen.
        </SuperHeader>
      )}
      {shouldShowPromotedBridgeRoute && (
        <Banner
          type="success"
          onClick={() => {
            history.push(promotedBridgeRoute.path);
          }}
        >
          {promotedBridgeRoute.logo}
          <Text size="lg" color="black-800" weight={500}>
            {promotedBridgeRoute.name} is now live! Bridge to{" "}
            {promotedBridgeRoute.name}
          </Text>
          <ArrowRightIcon />
        </Banner>
      )}
    </>
  );
}

const RemoveErrorSpan = styled.span`
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
`;

const ArrowRightIcon = styled(ArrowRight)`
  margin-left: 8px;
`;
