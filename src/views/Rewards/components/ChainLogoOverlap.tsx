import styled from "@emotion/styled";
import { Tooltip } from "components/Tooltip";
import { TokenImage } from "components/TokenImage";
import { COLORS, getChainInfo, rewardProgramTypes } from "utils";
import { useRewardProgramCard } from "../hooks/useRewardProgramCard";

const ChainLogoOverlap = ({ program }: { program: rewardProgramTypes }) => {
  const { enabledChains, rewardTokenSymbol, token } =
    useRewardProgramCard(program);
  const visibleChains = enabledChains.slice(1);

  // If there is only one chain, don't show the overlap
  if (visibleChains.length === 0) {
    return null;
  }

  const tooltipTitle = `${rewardTokenSymbol} Reward eligible routes`;
  const tooltipIcon = (
    <ChainTooltipIcon src={token.logoURI} alt={token.symbol} />
  );

  return (
    <ChainOverlapWrapper
      tooltipId="chain-overlap"
      title={tooltipTitle}
      icon={tooltipIcon}
      placement="bottom-start"
      body={
        <>
          You will earn {token.symbol} rewards from any of the following routes:
          <br />
          <br />
          <ul>
            {enabledChains.map((chain) => (
              <li key={chain}>Origin Chain → {getChainInfo(chain).name}</li>
            ))}
          </ul>
        </>
      }
    >
      {visibleChains.map((chain, idx) => (
        <ChainLogo
          key={chain}
          src={getChainInfo(chain).logoURI}
          alt={getChainInfo(chain).name}
          zIndex={idx + 1}
        />
      ))}
    </ChainOverlapWrapper>
  );
};

export default ChainLogoOverlap;

const ChainOverlapWrapper = styled(Tooltip)`
  display: flex;
  align-items: flex-start;
`;

const ChainLogo = styled(TokenImage)<{ zIndex: number }>`
  height: 18px;
  width: 18px;
  border-radius: 50%;
  border: 2px solid ${COLORS["grey-600"]};
  z-index: ${({ zIndex }) => zIndex};
  margin-left: -10px;
`;

const ChainTooltipIcon = styled(TokenImage)`
  width: 16px;
  height: 16px;

  margin-right: 8px;
`;
