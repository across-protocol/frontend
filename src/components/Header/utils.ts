/**
 * Checks whether the current pathname (possibly nested), matches given parent path.
 * @param pathname - Full pathname, e.g. `/transactions/all`
 * @param parentPath - Parent path to match against, e.g. `/transactions`
 * @returns Match result.
 */
export function isChildPath(pathname: string, parentPath: string) {
  const splitParentPath = parentPath.split("/");
  return splitParentPath.every(
    (parentPathElement, i) => pathname.split("/")[i] === parentPathElement
  );
}
