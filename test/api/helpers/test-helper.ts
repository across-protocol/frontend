export const createMockResponse = <TResponse>() => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<TResponse>;
};

export const createMockRequest = <TRequest>(query: Record<string, string>) => {
  return {
    query,
  } as unknown as TRequest;
};

export const setupTestMocks = <TResponse>(mockFn: jest.Mock) => {
  const mockResponse = createMockResponse<TResponse>();
  const mockGet = jest.fn();

  jest.clearAllMocks();
  mockFn.mockReturnValue({ get: mockGet });

  return {
    mockResponse,
    mockGet,
  };
};
