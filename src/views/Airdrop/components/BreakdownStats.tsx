import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as BridgeIcon } from "assets/icons/plaap/bridge.svg";
import { ReactComponent as TravellerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as LiquidityIcon } from "assets/icons/plaap/lp-arrow.svg";
import { Text } from "components/Text";
import { formatUnits, QUERIESV2 } from "utils";

import CardIcon from "./IconWithCheck";
import { BreakdownRow } from "./BreakdownRow";
import { AmountBreakdown } from "../hooks/useAirdropRecipient";

export type Props = {
  isLoading?: boolean;
  discord?: {
    discordName: string;
    discordAvatar?: string;
  };
  amount?: string;
  amountBreakdown?: AmountBreakdown;
};

export function BreakdownStats({
  isLoading,
  discord,
  amount,
  amountBreakdown,
}: Props) {
  const isEligible = getIsEligible(amountBreakdown);
  return (
    <Container>
      <BreakdownRow
        label={
          <CommunityLabelContainer>
            <Text
              size="lg"
              color={isEligible.communityRewards ? "white-100" : "white-70"}
            >
              Community Member
            </Text>
            <DiscordName
              size="lg"
              color={isEligible.communityRewards ? "aqua" : "error"}
            >
              {discord?.discordName}
            </DiscordName>
          </CommunityLabelContainer>
        }
        amount={amountBreakdown?.communityRewards}
        Icon={
          <CardIcon
            Icon={
              discord?.discordAvatar ? (
                <CustomAvatar src={discord.discordAvatar} />
              ) : (
                <DiscordIcon />
              )
            }
            checkIconState={
              isLoading
                ? "undetermined"
                : isEligible.communityRewards
                ? "eligible"
                : "ineligible"
            }
          />
        }
      />
      <BreakdownRow
        label={
          <Text
            size="lg"
            color={isEligible.welcomeTravelerRewards ? "white-100" : "white-70"}
          >
            Bridge Traveler Program
          </Text>
        }
        amount={amountBreakdown?.welcomeTravelerRewards}
        Icon={
          <CardIcon
            Icon={<TravellerIcon />}
            checkIconState={
              isLoading
                ? "undetermined"
                : isEligible.welcomeTravelerRewards
                ? "eligible"
                : "ineligible"
            }
          />
        }
      />
      <BreakdownRow
        label={
          <Text
            size="lg"
            color={isEligible.earlyUserRewards ? "white-100" : "white-70"}
          >
            Early Bridge User
          </Text>
        }
        amount={amountBreakdown?.earlyUserRewards}
        Icon={
          <CardIcon
            Icon={<BridgeIcon />}
            checkIconState={
              isLoading
                ? "undetermined"
                : isEligible.earlyUserRewards
                ? "eligible"
                : "ineligible"
            }
          />
        }
      />
      <BreakdownRow
        label={
          <Text
            size="lg"
            color={
              isEligible.liquidityProviderRewards ? "white-100" : "white-70"
            }
          >
            Liquidity Provider
          </Text>
        }
        amount={amountBreakdown?.liquidityProviderRewards}
        Icon={
          <CardIcon
            Icon={<LiquidityIcon />}
            checkIconState={
              isLoading
                ? "undetermined"
                : isEligible.liquidityProviderRewards
                ? "eligible"
                : "ineligible"
            }
          />
        }
      />
      <BreakdownTotalContainer>
        <Text size="lg" color="white-70">
          Total reward
        </Text>
        <Text size="lg" color={amount ? "aqua" : ""}>
          {amount ? `${formatUnits(amount, 18)} ACX` : "-"}
        </Text>
      </BreakdownTotalContainer>
    </Container>
  );
}

type EligibilityMap = {
  communityRewards: boolean;
  liquidityProviderRewards: boolean;
  earlyUserRewards: boolean;
  welcomeTravelerRewards: boolean;
};

function getIsEligible(
  amountBreakdown: AmountBreakdown = {
    communityRewards: "0",
    liquidityProviderRewards: "0",
    earlyUserRewards: "0",
    welcomeTravelerRewards: "0",
  }
): EligibilityMap {
  return Object.entries(amountBreakdown).reduce<EligibilityMap>(
    (acc, [key, value]) => ({
      ...acc,
      [key]: BigNumber.from(value).gt(0),
    }),
    {} as EligibilityMap
  );
}

const CustomAvatar = styled.img`
  border-radius: 50%;
  height: 40px;
  width: 40px;
  padding: 1px;
`;

const CommunityLabelContainer = styled.div`
  display: flex;
  gap: 16px;
`;

const DiscordName = styled(Text)`
  max-width: 144px;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: stretch;
  padding: 16px 24px;
  border-top: 1px solid #4c4e57;

  @media ${QUERIESV2.sm.andDown} {
    padding: 12px;
  }
`;

const BreakdownTotalContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  width: 100%;

  border-top: 1px solid #4c4e57;
  margin-top: 8px;
  padding-top: 16px;
`;
