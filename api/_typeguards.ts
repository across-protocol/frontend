export const isError = (input: unknown): input is Error =>
  input instanceof Error;

export const isPromiseRejectedResult = (
  input: PromiseSettledResult<unknown>
): input is PromiseRejectedResult => input.status === "rejected";
