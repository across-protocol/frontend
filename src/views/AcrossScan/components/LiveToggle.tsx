import styled from "@emotion/styled";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { COLORS } from "utils";

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
      body: "Clear the filters to enable live updates",
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
  const tooltipContent = getTooltipContent(disabledReason);

  const toggle = (
    <ToggleContainer disabled={disabled}>
      <LiveIndicator isActive={isLiveMode && !disabled} />
      <LabelContainer>
        <LiveText disabled={disabled}>Live</LiveText>
        <UpdatesText disabled={disabled}>Updates</UpdatesText>
      </LabelContainer>
      <ToggleSwitch>
        <ToggleInput
          type="checkbox"
          checked={isLiveMode}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
        />
        <ToggleSlider checked={isLiveMode} disabled={disabled} />
      </ToggleSwitch>
    </ToggleContainer>
  );

  if (disabled) {
    return (
      <div>
        <Tooltip
          tooltipId="live-toggle-disabled"
          title={tooltipContent.title}
          body={<Text size="sm">{tooltipContent.body}</Text>}
          placement="bottom"
        >
          <TooltipWrapper>{toggle}</TooltipWrapper>
        </Tooltip>
      </div>
    );
  }

  return <TooltipWrapper>{toggle}</TooltipWrapper>;
}

const TooltipWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const ToggleContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "default")};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const LiveIndicator = styled.div<{ isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ isActive }) =>
    isActive ? COLORS.aqua : COLORS["grey-400"]};
  transition: background-color 0.2s ease;
`;

const LabelContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LiveText = styled.span<{ disabled?: boolean }>`
  font-family: Barlow, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: ${({ disabled }) => (disabled ? COLORS["grey-400"] : COLORS.white)};
`;

const UpdatesText = styled.span<{ disabled?: boolean }>`
  font-family: Barlow, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: ${({ disabled }) =>
    disabled ? COLORS["grey-400"] : COLORS["grey-400"]};
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  margin-left: 4px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const ToggleSlider = styled.span<{ checked: boolean; disabled?: boolean }>`
  position: absolute;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ checked }) =>
    checked ? COLORS.aqua : COLORS["grey-500"]};
  transition: 0.3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: ${({ checked }) => (checked ? "23px" : "3px")};
    bottom: 3px;
    background-color: ${({ checked }) =>
      checked ? COLORS["grey-600"] : COLORS.white};
    transition: 0.3s;
    border-radius: 50%;
  }
`;
