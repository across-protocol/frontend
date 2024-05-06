import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Text, TextColor } from "components/Text";
import {
  formatUnitsWithMaxFractions,
  getChainInfo,
  getExplorerLinkForToken,
  hubPoolChainId,
  TokenInfo,
} from "utils";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/external-link-boxed.svg";

type TokenFeeProps = {
  token: TokenInfo;
  amount: BigNumber;
  textColor?: TextColor;
  showTokenLinkOnHover?: boolean;
  tokenChainId: number;
};

const TokenFee = ({
  token,
  amount,
  textColor = "grey-400",
  showTokenLinkOnHover,
  tokenChainId,
}: TokenFeeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const tokenAddress = token.addresses?.[tokenChainId];
  const tokenLink = getExplorerLinkForToken(
    tokenAddress || token.mainnetAddress!,
    tokenChainId
  );
  return (
    <Wrapper>
      <NumericText size="md" color={textColor}>
        {formatUnitsWithMaxFractions(amount, token.decimals)}{" "}
        {token.displaySymbol || token.symbol.toUpperCase()}{" "}
      </NumericText>
      {showTokenLinkOnHover ? (
        <TokenLinkWrapper
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          href={tokenLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <AnimatePresence>
            {isHovered ? (
              <motion.div
                key="token-link"
                animate={{ y: 0 }}
                exit={{ y: "+100%" }}
                transition={{ duration: 0.2 }}
              >
                <ExternalLinkIcon />
              </motion.div>
            ) : (
              <motion.div
                key="token-symbol"
                exit={{ y: "-100%" }}
                transition={{ duration: 0.2 }}
              >
                <TokenSymbol src={token.logoURI} />
              </motion.div>
            )}
          </AnimatePresence>
        </TokenLinkWrapper>
      ) : (
        <TokenSymbol src={token.logoURI} />
      )}
    </Wrapper>
  );
};

export default TokenFee;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

const TokenSymbol = styled.img`
  width: 16px;
  height: 16px;
`;

const NumericText = styled(Text)`
  font-variant-numeric: tabular-nums !important;
`;

const TokenLinkWrapper = styled.a`
  overflow-y: hidden;
  height: 24px;
  cursor: pointer;
`;
