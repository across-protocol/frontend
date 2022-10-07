import { renderHook, act } from "@testing-library/react-hooks";
import useScrollPosition from "../useScrollPosition";

test("should have a default scroll position", () => {
  const { result } = renderHook(() => useScrollPosition());
  expect(result.current).toEqual(0);
  act(() => {
    global.pageYOffset = 100;
    global.dispatchEvent(new Event("scroll"));
  });
  expect(result.current).toEqual(100);
});
