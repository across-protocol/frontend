// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import useScrollPosition from "../useScrollPosition";

test("should have a default scroll position", () => {
  const { result } = renderHook(() => useScrollPosition());
  expect(result.current).toEqual(0);
});

// TODO fix this test

// test("scrollPosition updates on change", () => {
//   const { result } = renderHook(() => useScrollPosition());

//   act(() => {
//     global.scrollY = 1000;
//     // Trigger the window resize event.
//     global.dispatchEvent(new Event("scroll"));
//   });
//   expect(result.current).toEqual(100);
// });
