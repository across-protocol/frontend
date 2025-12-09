// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import useWindowSize from "../useWindowSize";

test("should have a default window size", () => {
  const { result } = renderHook(() => useWindowSize());
  expect(result.current.width).toEqual(1024);
  expect(result.current.height).toEqual(768);
});

test("Resize should change default width and height", () => {
  const { result } = renderHook(() => useWindowSize());

  act(() => {
    global.innerWidth = 1000;
    global.innerHeight = 500;
    // Trigger the window resize event.
    global.dispatchEvent(new Event("resize"));
  });
  expect(result.current.width).toEqual(1000);
  expect(result.current.height).toEqual(500);
});
