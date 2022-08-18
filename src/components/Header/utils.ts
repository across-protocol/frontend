/**
 * Checks whether the current pathname (possibly nested), matches given parent path.
 * @param pathname - Full pathname, e.g. `/transactions/all`
 * @param parentPath - Parent path to match against, e.g. `/transactions`
 * @returns Match result.
 */
export function isChildPath(pathname: string, parentPath: string) {
  return pathname.split("/")[1] === parentPath.split("/")[1];
}
