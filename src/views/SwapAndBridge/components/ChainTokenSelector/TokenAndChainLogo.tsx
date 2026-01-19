import { ChainInfo } from "../../../../constants/chains";
import styled from "@emotion/styled";
import { TokenImage } from "../../../../components";
import { COLORS } from "../../../../utils";

export function TokenAndChainLogo(props: {
  src: string;
  alt: string;
  chain: ChainInfo;
}) {
  return (
    <TokenStack>
      <TokenImg src={props.src} alt={props.alt} />
      <ChainImg src={props.chain.logoURI} alt={props.chain.name} />
    </TokenStack>
  );
}

const TokenStack = styled.div`
  --height: 48px;
  --padding: 8px;

  height: 100%;
  width: var(--height);
  padding-inline: var(--padding);
  display: flex;
  align-items: center;
  position: relative;
`;
const TokenImg = styled(TokenImage)`
  border-radius: 50%;
  width: calc(var(--height) * 0.66);
  height: calc(var(--height) * 0.66);
  z-index: 1;
`;
const ChainImg = styled(TokenImage)`
  border-radius: 50%;
  border: 1px solid transparent;
  background: ${COLORS["grey-600"]};
  position: absolute;
  bottom: calc(var(--padding) / 2);
  right: calc(var(--padding) / 2);
  width: 30%;
  height: 30%;
  z-index: 2;
`;
