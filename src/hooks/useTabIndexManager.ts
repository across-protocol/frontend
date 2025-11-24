import { useEffect, useRef } from "react";

/**
 * Custom hook that manages tab indices for modal content
 * When active, it sets all elements outside the modal to tabindex="-1"
 * and restores their original tabindex values when inactive
 * @param isActive - Whether the tab index management should be active
 * @param containerRef - Reference to the container element to preserve tab indices within
 */
export const useTabIndexManager = (
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement>
) => {
  const originalTabIndices = useRef<Map<HTMLElement, string | null>>(new Map());

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    const modalElement = containerRef.current;
    const tabIndicesMap = originalTabIndices.current;

    // Only target elements that are naturally focusable
    const focusableElements = document.querySelectorAll(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
    ) as NodeListOf<HTMLElement>;

    // Store original tabindex values and set elements outside modal to tabindex="-1"
    focusableElements.forEach((element) => {
      // Skip elements inside the modal
      if (modalElement.contains(element)) {
        return;
      }

      const currentTabIndex = element.getAttribute("tabindex");
      tabIndicesMap.set(element, currentTabIndex);
      element.setAttribute("tabindex", "-1");
    });

    // Cleanup function
    return () => {
      // Restore original tabindex values
      tabIndicesMap.forEach((originalTabIndex, element) => {
        if (originalTabIndex === null) {
          element.removeAttribute("tabindex");
        } else {
          element.setAttribute("tabindex", originalTabIndex);
        }
      });
      tabIndicesMap.clear();
    };
  }, [isActive, containerRef]);
};
