import styled from "@emotion/styled";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";

type DisabledReason = "filtering" | "not-first-page";

type Props = {
  isLiveMode: boolean;
  onToggle: (value: boolean) => void;
  disabled: boolean;
  disabledReason?: DisabledReason;
};

const getTooltipContent = (reason: DisabledReason) => {
  const messages = {
    filtering: {
      title: "Live updates disabled during filtering",
      body: "Clear the wallet address filter to enable live updates",
    },
    "not-first-page": {
      title: "Live updates only available on first page",
      body: "Navigate to the first page to enable live updates",
    },
  };

  return messages[reason];
};

export function LiveToggle({
  isLiveMode,
  onToggle,
  disabled,
  disabledReason = "not-first-page",
}: Props) {
  const toggleContent = (
    <ToggleSection disabled={disabled}>
      <ToggleSwitch>
        <ToggleInput
          type="checkbox"
          checked={isLiveMode}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
        />
        <ToggleSlider disabled={disabled} />
      </ToggleSwitch>
      <Text size="sm" color={disabled ? "grey-400" : undefined}>
        Live updates
      </Text>
    </ToggleSection>
  );

  if (!disabled) {
    return toggleContent;
  }

  const tooltipContent = getTooltipContent(disabledReason);

  return (
    <Tooltip
      tooltipId="live-toggle-disabled"
      title={tooltipContent.title}
      body={<Text size="sm">{tooltipContent.body}</Text>}
      placement="bottom"
    >
      {toggleContent}
    </Tooltip>
  );
}

const ToggleSection = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(62, 64, 71, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "default")};

  &:hover {
    background: ${({ disabled }) =>
      disabled ? "rgba(62, 64, 71, 0.3)" : "rgba(62, 64, 71, 0.5)"};
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #6cf9d8;
  }

  &:checked + span:before {
    transform: translateX(16px);
  }

  &:disabled + span {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ToggleSlider = styled.span<{ disabled?: boolean }>`
  position: absolute;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #3e4047;
  transition: 0.3s;
  border-radius: 20px;

  &:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;
