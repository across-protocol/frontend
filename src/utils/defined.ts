export function isDefined<T>(value: unknown): value is T {
  return value !== undefined && value !== null;
}
