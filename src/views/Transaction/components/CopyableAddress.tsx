import { TextColor, TextSize } from "components/Text";
import { CSSProperties } from "react";
import { useEnsQuery } from "hooks/useEns";
import { shortenAddress } from "utils/format";
import { CopyableText } from "./CopyableText";

type Props = {
  address: string;
  explorerLink?: string;
  color?: TextColor;
  size?: TextSize;
  weight?: number;
  style?: CSSProperties;
};

export function CopyableAddress({
  address,
  explorerLink,
  color,
  size,
  weight,
  style,
}: Props) {
  const { data } = useEnsQuery(address);

  return (
    <CopyableText
      textToCopy={address}
      explorerLink={explorerLink}
      color={color}
      size={size}
      weight={weight}
      style={style}
    >
      {data.ensName ?? shortenAddress(address, "...", 6)}
    </CopyableText>
  );
}
