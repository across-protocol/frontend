import { useState, useCallback, createContext, FC, ReactNode } from "react";

interface ContextProps {
  error: string | undefined;
  addError: (message: Error) => void;
  removeError: () => void;
}

export const ErrorContext = createContext<ContextProps>({
  error: undefined,
  addError: () => {},
  removeError: () => {},
});

interface ProviderProps {
  children: ReactNode;
}

const ErrorProvider: FC<ProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | undefined>(undefined);

  const removeError = () => setError(undefined);

  const addError = (error: Error | undefined) => setError(error?.message);

  const contextValue: ContextProps = {
    error,
    addError: useCallback((error) => addError(error), []),
    removeError: useCallback(() => removeError(), []),
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

export default ErrorProvider;
