import { isChildPath } from "../utils";

describe("#isChildPath()", () => {
  test("match one level path", () => {
    expect(isChildPath("/", "/")).toBeTruthy();
    expect(isChildPath("/parent", "/parent")).toBeTruthy();
  });

  test("match nested path", () => {
    expect(isChildPath("/parent/child", "/parent")).toBeTruthy();
  });

  test("do not match wrong path", () => {
    expect(isChildPath("/parent/child", "/other-parent")).toBeFalsy();
  });

  test("do not match root path", () => {
    expect(isChildPath("/parent/child", "/")).toBeFalsy();
  });
});
