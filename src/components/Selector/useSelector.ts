import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import { useState } from "react";
import { SelectorElementType } from "./Selector";

export function useSelector<ValueType>(
  elements: SelectorElementType<ValueType>[],
  selectedValue: ValueType
) {
  const [displayModal, setDisplayModal] = useState(false);
  const selectedIndex = elements.findIndex(
    (element) => element.value === selectedValue
  );
  const { isMobile } = useCurrentBreakpoint();

  return {
    displayModal,
    setDisplayModal,
    selectedIndex: selectedIndex < 0 ? 0 : selectedIndex,
    isMobile,
  };
}
