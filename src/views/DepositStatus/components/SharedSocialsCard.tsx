import styled from "@emotion/styled";
import { Text } from "components";
import { BigNumber } from "ethers";
import { formatUnitsWithMaxFractions, getChainInfo, QUERIESV2 } from "utils";
import { useToken } from "hooks/useToken";
import SocialShareButton from "./SocialShareButton";

type SharedSocialsCardParamsType = {
  inputTokenSymbol: string;
  fromChainId: number;
  toChainId: number;
  amountSent?: BigNumber;
};

const SharedSocialsCard = ({
  inputTokenSymbol,
  fromChainId,
  toChainId,
  amountSent,
}: SharedSocialsCardParamsType) => {
  const token = useToken(inputTokenSymbol);
  const fromChain = getChainInfo(fromChainId).name;
  const toChain = getChainInfo(toChainId).name;
  const amountSentText =
    amountSent && token
      ? `~${formatUnitsWithMaxFractions(amountSent, token.decimals)}`
      : undefined;

  const shareText = [
    `I just bridged ${amountSentText}${inputTokenSymbol} from ${fromChain} to ${toChain} using @AcrossProtocol.`,
  ].join("\n\n");

  return (
    <Wrapper>
      <Text color="grey-400">Share on</Text>
      <WrapperSocial>
        <SocialShareButton socialName="x" shareText={shareText} />
        <SocialShareButton socialName="farcaster" shareText={shareText} />
      </WrapperSocial>
    </Wrapper>
  );
};

export default SharedSocialsCard;

const Wrapper = styled.div`
  display: flex;
  padding-left: 16px;
  align-items: center;
  gap: 28px;
  align-self: stretch;

  @media ${QUERIESV2.sm.andDown} {
    gap: 16px;
  }
`;

const WrapperSocial = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 0 0;
`;
