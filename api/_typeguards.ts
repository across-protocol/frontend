/**
 * Determines if a given input is a string
 * @param input An unknown argument that will test against the type of a string
 * @returns A boolean. `true` if the input is a string, `false` otherwise
 */
export const isString = (input: unknown): input is string =>
  typeof input === "string";

export const isError = (input: unknown): input is Error =>
  input instanceof Error;

export const isPromiseRejectedResult = (
  input: PromiseSettledResult<unknown>
): input is PromiseRejectedResult => input.status === "rejected";
