import styled from "@emotion/styled";
import { ReactComponent as Arrow } from "assets/icons/arrow-16.svg";
import Modal from "components/Modal";
import { Text } from "components/Text";
import { useSelector } from "./useSelector";

export type SelectorElementType<Value> = {
  value: Value;
  element: JSX.Element;
};

export type SelectorPropType<Value> = {
  title: string;
  elements: SelectorElementType<Value>[];
  selectedValue: Value;
  setSelectedValue: (ind: Value) => void;
};

const Selector = <ElementValue,>({
  elements,
  selectedValue,
  setSelectedValue,
  title,
}: SelectorPropType<ElementValue>) => {
  const { displayModal, setDisplayModal, selectedIndex } = useSelector(
    elements,
    selectedValue
  );
  return (
    <>
      <Wrapper onClick={() => setDisplayModal(true)}>
        <InternalWrapper>
          <ActiveElementWrapper>
            {elements[selectedIndex].element}
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
        verticalLocation="top"
        topYOffset={112}
        exitOnOutsideClick
        title={
          <Text size="md" color="grey-400">
            {title}
          </Text>
        }
        padding="thin"
      >
        <ElementRowWrapper enableScroll={elements.length > 7}>
          <ElementRowDivider />
          {elements.map((element, idx) => (
            <ElementRow
              key={idx}
              onClick={() => {
                setSelectedValue(element.value);
                setDisplayModal(false);
              }}
              active={selectedIndex === idx}
            >
              <ElementSection> {element.element}</ElementSection>
              <ElementSection>
                {idx === selectedIndex ? (
                  <ActiveIcon>
                    <ActiveSelectedIcon />
                  </ActiveIcon>
                ) : (
                  <InactiveIcon />
                )}
              </ElementSection>
            </ElementRow>
          ))}
        </ElementRowWrapper>
      </Modal>
    </>
  );
};

export default Selector;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 20px;

  height: 64px;
  width: 100%;

  background: #2d2e33;
  border: 1px solid #4c4e57;
  border-radius: 32px;

  cursor: pointer;
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
  margin: 0px -16px;

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
  width: 100%;
  background: #34353b;
`;

const ElementRow = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 12px 14px 16px;
  cursor: pointer;
  width: 100%;

  background: ${({ active }) => (active ? "#2d2e33" : "transparent")};

  &:hover {
    background: #2d2e33;
  }
`;

const ElementSection = styled.div``;

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
