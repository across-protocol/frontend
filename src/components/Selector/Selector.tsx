import styled from "@emotion/styled";
import { ReactComponent as Arrow } from "assets/icons/chevron-down.svg";
import Modal from "components/Modal";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { QUERIESV2 } from "utils";
import { ReactComponent as II } from "assets/icons/info.svg";
import { useSelector } from "./useSelector";
import { ModalProps } from "components/Modal/Modal";

export type SelectorElementType<Value> = {
  value: Value;
  element: JSX.Element;
  suffix?: JSX.Element;
  disabled?: boolean;
  disabledTooltip?: {
    title: string;
    description: string | JSX.Element;
  };
};

export type SelectorPropType<Value> = {
  title: string | JSX.Element;
  elements: SelectorElementType<Value>[];
  selectedValue: Value;
  setSelectedValue: (ind: Value) => void;
  modalProps?: Partial<ModalProps>;
  displayElement?: JSX.Element;
  disabled?: boolean;
  "data-cy"?: string;
  allowSelectDisabled?: boolean;
};

const Selector = <ElementValue,>({
  elements,
  selectedValue,
  setSelectedValue,
  title,
  displayElement,
  disabled,
  "data-cy": dataCy,
  allowSelectDisabled,
  modalProps,
}: SelectorPropType<ElementValue>) => {
  const { displayModal, setDisplayModal, selectedIndex, isMobile } =
    useSelector(elements, selectedValue);
  return (
    <>
      <Wrapper
        disabled={disabled}
        onClick={() => !disabled && setDisplayModal(true)}
        data-cy={dataCy}
      >
        <InternalWrapper>
          <ActiveElementWrapper>
            {displayElement ? displayElement : elements[selectedIndex]?.element}
          </ActiveElementWrapper>
          <StyledArrowIcon />
        </InternalWrapper>
      </Wrapper>
      <Modal
        exitModalHandler={() => {
          setDisplayModal(false);
        }}
        isOpen={displayModal}
        width={400}
        verticalLocation={{
          tablet: "top",
          desktop: "top",
          mobile: "bottom",
        }}
        topYOffset={isMobile ? undefined : 112}
        bottomYOffset={isMobile ? 16 : undefined}
        exitOnOutsideClick
        title={
          typeof title === "string" ? (
            <Text size="md" color="grey-400">
              {title}
            </Text>
          ) : (
            title
          )
        }
        padding="thin"
        data-cy={`${dataCy}-modal`}
        {...modalProps}
      >
        <ElementRowDivider />
        <ElementRowWrapper enableScroll={elements.length > 6}>
          {elements.map((element, idx) => (
            <ElementRow
              key={
                typeof element.value === "object"
                  ? JSON.stringify(element.value)
                  : String(element.value)
              }
              onClick={() => {
                if (element.disabled && !allowSelectDisabled) {
                  return;
                }
                setSelectedValue(element.value);
                setDisplayModal(false);
              }}
              active={!element.disabled && selectedIndex === idx}
              disabled={element.disabled && !allowSelectDisabled}
            >
              <ElementSection disabled={element.disabled}>
                {element.element}
              </ElementSection>
              <ElementSection>
                <ElementSuffixWrapper largeGap={element.disabled}>
                  {element.disabled ? (
                    <Text size="sm" color="grey-400">
                      Not supported
                    </Text>
                  ) : (
                    element.suffix
                  )}
                  {element.disabled ? (
                    <Tooltip
                      tooltipId={`selector-disabled-${idx}`}
                      title={element.disabledTooltip?.title ?? "Not supported."}
                      body={
                        element.disabledTooltip?.description ??
                        "This asset is not supported within this context."
                      }
                      placement="bottom-start"
                    >
                      <InfoIconWrapper>
                        <InfoIcon />
                      </InfoIconWrapper>
                    </Tooltip>
                  ) : idx === selectedIndex ? (
                    <ActiveIcon>
                      <ActiveSelectedIcon />
                    </ActiveIcon>
                  ) : (
                    <InactiveIcon />
                  )}
                </ElementSuffixWrapper>
              </ElementSection>
            </ElementRow>
          ))}
        </ElementRowWrapper>
      </Modal>
    </>
  );
};

export default Selector;

const Wrapper = styled.div<{ disabled?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 9px 12px;
  padding-left: 16px;

  height: 48px;
  width: 100%;

  background: #2d2e33;
  border: 1px solid #3e4047;
  border-radius: 12px;

  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};

  @media ${QUERIESV2.sm.andDown} {
    padding: 12px;
    height: 48px;
  }
`;

const InternalWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 100%;
`;

const ActiveElementWrapper = styled.div``;

const StyledArrowIcon = styled(Arrow)``;

const ElementRowWrapper = styled.div<{ enableScroll?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  margin: 0px -16px -16px;

  width: calc(100% + 32px);
  overflow-y: ${({ enableScroll }) => (enableScroll ? "scroll" : "none")};

  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
`;

const ElementRowDivider = styled.div`
  height: 1px;
  min-height: 1px;
  background: #34353b;

  margin: 0px -16px -16px;
  width: calc(100% + 32px);
`;

const ElementRow = styled.div<{
  active: boolean;
  disabled?: boolean;
}>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 12px 14px 16px;
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  width: 100%;

  background: ${({ active, disabled }) =>
    active && !disabled ? "#2d2e33" : "transparent"};

  &:hover {
    background: ${({ disabled }) => (!disabled ? "#2d2e33" : "transparent")};
  }
`;

const ElementSection = styled.div<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const InactiveIcon = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 4px;
  gap: 10px;

  width: 16px;
  height: 16px;

  margin: 4px;

  border: 1px solid #c5d5e0;
  border-radius: 9px;
`;

const ActiveIcon = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 4px;
  gap: 10px;

  width: 16px;
  height: 16px;

  margin: 4px;

  border: 1px solid #44d2ff;
  border-radius: 9px;
`;

const ActiveSelectedIcon = styled.div`
  width: 8px;
  height: 8px;

  border-radius: 8px;

  flex-shrink: 0;

  background: #44d2ff;
`;

const ElementSuffixWrapper = styled.div<{ largeGap?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0px;
  gap: ${({ largeGap }) => (largeGap ? "16px" : "4px")};
`;

const InfoIcon = styled(II)`
  height: 16px;
  width: 16px;
`;

const InfoIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 24px;
  width: 24px;
`;
