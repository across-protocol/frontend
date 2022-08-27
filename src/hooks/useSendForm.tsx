import {
  useReducer,
  useEffect,
  useCallback,
  useContext,
  createContext,
} from "react";
import { ethers } from "ethers";
import {
  ChainId,
  getAddress,
  ParsingError,
  InsufficientBalanceError,
  chainInfoList,
  getConfig,
  Routes,
  Route,
  TokenList,
  ChainInfo,
  ChainInfoList,
  isSupportedChainId,
} from "utils";

import { usePrevious } from "hooks";
import { useConnection } from "state/hooks";
import { useQueryParams } from "./useQueryParams";
import { useHistory } from "react-router-dom";
export enum FormStatus {
  IDLE = "idle",
  TOUCHED = "touched",
  VALID = "valid",
  ERROR = "error",
}

type FormState = {
  status: FormStatus;
  amount: ethers.BigNumber;
  tokenSymbol?: string;
  toChain?: ChainId;
  fromChain?: ChainId;
  toAddress?: string;
  error?: ParsingError;
  availableRoutes: Routes;
  selectedRoute?: Route;
  availableToChains: Array<ChainInfo & { disabled?: boolean }>;
  availableFromChains: Array<ChainInfo & { disabled?: boolean }>;
  availableTokens: TokenList;
};

enum ActionType {
  SET_TOKEN = "SET_TOKEN",
  SET_AMOUNT = "SET_AMOUNT",
  SET_TO_CHAIN = "SET_TO_CHAIN",
  SET_FROM_CHAIN = "SET_FROM_CHAIN",
  SET_TO_ADDRESS = "SET_TO_ADDRESS",
  SET_ERROR = "SET_ERROR",
}
type Action =
  | {
      type: ActionType.SET_TOKEN;
      payload: string;
    }
  | {
      type: ActionType.SET_AMOUNT;
      payload: ethers.BigNumber;
    }
  | {
      type: ActionType.SET_TO_CHAIN;
      payload: ChainId;
    }
  | {
      type: ActionType.SET_FROM_CHAIN;
      payload: ChainId;
    }
  | {
      type: ActionType.SET_TO_ADDRESS;
      payload: string;
    }
  | {
      type: ActionType.SET_ERROR;
      payload: ParsingError | InsufficientBalanceError | undefined;
    };

// given an from chain, return list of chains and mark unavailalbe ones as disabled
export function calculateAvailableToChains(
  fromChain: ChainId,
  routes: Routes,
  availableChains: ChainInfoList = chainInfoList
) {
  const routeLookup: Record<number, boolean> = {};
  routes.forEach((route) => {
    routeLookup[route.toChain] = fromChain !== route.toChain;
  });
  return availableChains.map((chain) => {
    return {
      ...chain,
      disabled: Boolean(!routeLookup[chain.chainId]),
    };
  });
}

function tokenReducer(state: FormState, tokenSymbol: string): FormState {
  const config = getConfig();
  let fromChain = state.fromChain;
  let toChain = state.toChain;
  let availableRoutes = config.filterRoutes({
    toChain,
    fromChain,
    fromTokenSymbol: tokenSymbol,
  });

  // we have from, to, symbols that produce no routes, so reset the form to the first valid route
  if (!availableRoutes.length) {
    availableRoutes = config.filterRoutes({ fromTokenSymbol: tokenSymbol });
  }
  const [firstRoute] = availableRoutes;
  fromChain = firstRoute.fromChain;
  toChain = firstRoute.toChain;
  const selectedRoute = firstRoute;

  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.VALID:
    case FormStatus.ERROR:
      return {
        ...state,
        status: FormStatus.IDLE,
        tokenSymbol,
        fromChain,
        toChain,
        error: undefined,
        availableRoutes,
        selectedRoute,
      };

    default:
      throw new Error("unreachable");
  }
}

function amountReducer(state: FormState, amount: ethers.BigNumber): FormState {
  const isLtZero = amount.lt(0);
  const isGtZero = amount.gt(0);
  const canTransitionToValid = !!state.toAddress && isGtZero;
  const error = isLtZero ? new ParsingError() : undefined;
  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.ERROR:
      return {
        ...state,
        amount,
        status: isLtZero
          ? FormStatus.ERROR
          : !canTransitionToValid
          ? FormStatus.TOUCHED
          : FormStatus.VALID,
        error,
      };
    case FormStatus.VALID:
      return {
        ...state,
        amount,
        status: isLtZero
          ? FormStatus.ERROR
          : isGtZero
          ? FormStatus.VALID
          : FormStatus.TOUCHED,
        error,
      };

    default:
      throw new Error("unreachable");
  }
}

// this has highest priority, this drives the rest of the components when selected
function fromChainReducer(state: FormState, chainId: ChainId): FormState {
  const config = getConfig();
  let fromChain = chainId;
  // reset toChain
  let toChain = state.toChain;
  let tokenSymbol = state.tokenSymbol;

  // availble routes are all possible routes with this from chain selected
  const availableRoutes = config.filterRoutes({ fromChain });
  // selected routes are all possible chains given the users selection from chain and token symbol.
  let selectedRoutes = config.filterRoutes({
    fromChain,
    toChain,
    fromTokenSymbol: tokenSymbol,
  });
  // if no valid routes found with user selection, de-prioritize the toChain to maintain token symbol.
  if (selectedRoutes.length === 0) {
    selectedRoutes = config.filterRoutes({
      fromChain,
      fromTokenSymbol: tokenSymbol,
    });
  }
  // prioritize selected routes, otherwise use first available route
  const selectedRoute = selectedRoutes[0] || availableRoutes[0];
  fromChain = selectedRoute.fromChain;
  tokenSymbol = selectedRoute.fromTokenSymbol;
  toChain = selectedRoute.toChain;

  const availableToChains = calculateAvailableToChains(
    chainId,
    availableRoutes,
    config.listToChains()
  );

  const availableTokens = config.filterReachableTokens(fromChain, toChain);

  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.VALID:
    case FormStatus.ERROR:
      return {
        ...state,
        status: FormStatus.IDLE,
        fromChain,
        toChain,
        tokenSymbol,
        availableRoutes,
        availableToChains,
        availableTokens,
        selectedRoute,
      };
    default:
      throw new Error("unreachable");
  }
}

// second priority
function toChainReducer(state: FormState, chainId: ChainId): FormState {
  const config = getConfig();
  let fromChain = state.fromChain;
  let tokenSymbol = state.tokenSymbol;
  let toChain = chainId;
  let availableRoutes = config.filterRoutes({
    toChain,
    fromChain,
    fromTokenSymbol: tokenSymbol,
  });

  // we have from, to, symbols that produce no routes, so reset the form to the first valid route
  if (!availableRoutes.length) {
    availableRoutes = config.filterRoutes({ toChain });
  }

  const [firstRoute] = availableRoutes;
  fromChain = firstRoute.fromChain;
  tokenSymbol = firstRoute.fromTokenSymbol;
  const selectedRoute = firstRoute;

  const availableTokens = fromChain
    ? config.filterReachableTokens(fromChain, toChain)
    : state.availableTokens;

  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.VALID:
    case FormStatus.ERROR:
      return {
        ...state,
        status: FormStatus.IDLE,
        toChain,
        fromChain,
        tokenSymbol,
        error: undefined,
        availableRoutes,
        selectedRoute,
        availableTokens,
      };
    default:
      throw new Error("unreachable");
  }
}

function toAddressReducer(state: FormState, address: string): FormState {
  const isAmountGtZero = state.amount.gt(0);
  switch (state.status) {
    case FormStatus.IDLE: {
      return {
        ...state,
        status: FormStatus.TOUCHED,
        toAddress: address,
      };
    }
    case FormStatus.TOUCHED:
      return {
        ...state,
        status: isAmountGtZero ? FormStatus.VALID : FormStatus.TOUCHED,
        toAddress: address,
      };
    case FormStatus.VALID:
    case FormStatus.ERROR:
      return { ...state, toAddress: address };
    default:
      throw new Error("unreachable");
  }
}

function errorReducer(
  state: FormState,
  error: ParsingError | undefined
): FormState {
  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.VALID:
      return { ...state, status: FormStatus.ERROR, error };
    case FormStatus.ERROR:
      return state;
    default:
      throw new Error("unreachable");
  }
}

function formReducer(state: FormState, action: Action) {
  switch (action.type) {
    case ActionType.SET_TOKEN:
      return tokenReducer(state, action.payload);
    case ActionType.SET_AMOUNT:
      return amountReducer(state, action.payload);
    case ActionType.SET_TO_CHAIN:
      return toChainReducer(state, action.payload);
    case ActionType.SET_FROM_CHAIN:
      return fromChainReducer(state, action.payload);
    case ActionType.SET_TO_ADDRESS:
      return toAddressReducer(state, action.payload);
    case ActionType.SET_ERROR:
      return errorReducer(state, action.payload);

    default: {
      throw new Error(`Unhandled action type`);
    }
  }
}

type SendFormManagerContext = FormState & {
  setFromChain: (fromChain: ChainId) => void;
  setToChain: (toChain: ChainId) => void;
  setTokenSymbol: (tokenSymbol: string) => void;
  setAmount: (amount: ethers.BigNumber) => void;
  setToAddress: (toAddress: string) => void;
  setError: (error: ParsingError | undefined) => void;
};

function useSendFormManager(): SendFormManagerContext {
  const config = getConfig();
  const initialFormState: FormState = {
    status: FormStatus.IDLE,
    amount: ethers.constants.Zero,
    availableRoutes: config.getRoutes(),
    availableFromChains: config.listFromChains(),
    availableToChains: [],
    availableTokens: [],
  };
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const { account: connectedAccount, chainId } = useConnection();
  const params = useQueryParams();
  const history = useHistory();
  /**
   * This will set the Send Form values from a pre-defined state for the user.
    URL Params available --
    Required: to, from.
    Optional: asset, amount.
    Because we need the asset's decimal value, you need to define **both** asset and amount for the optional params.
   */
  useEffect(() => {
    const fromChain = Number(params.from);
    const toChain = Number(params.to);
    const areSupportedChains = [fromChain, toChain].every(
      config.isSupportedChainId
    );
    if (!areSupportedChains) {
      return;
    }
    if (config.canBridge(fromChain, toChain)) {
      dispatch({ type: ActionType.SET_FROM_CHAIN, payload: fromChain });
      dispatch({ type: ActionType.SET_TO_CHAIN, payload: toChain });

      if (params.asset) {
        try {
          const token = config.getTokenInfoBySymbol(
            fromChain,
            params.asset.toUpperCase()
          );
          if (token) {
            dispatch({ type: ActionType.SET_TOKEN, payload: token.symbol });
          }
        } catch (err) {
          console.error("err", err);
          history.replace({
            search: "",
          });
        }
      }
    } else {
      dispatch({ type: ActionType.SET_FROM_CHAIN, payload: fromChain });
    }
  }, [params.from, params.to, params.asset, params.amount, config, history]);

  // Keep the connected account and the toAddress in sync. If a user switches account, the toAddress should be updated to this new account.
  useEffect(() => {
    if (connectedAccount) {
      dispatch({
        type: ActionType.SET_TO_ADDRESS,
        payload: getAddress(connectedAccount),
      });
      if (isSupportedChainId(chainId)) {
        dispatch({
          type: ActionType.SET_FROM_CHAIN,
          payload: chainId,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAccount]);
  /*
	  The following block will change `fromChain` and `toChain` when the user first connects to the app.
    If connected to an unsupported chain, `fromChain` and `toChain` won't be set.
	*/
  const previousChainId = usePrevious(chainId);
  useEffect(() => {
    // The user has just connected to the app.
    if (chainId && previousChainId === undefined) {
      if (config.isSupportedChainId(chainId)) {
        dispatch({
          type: ActionType.SET_FROM_CHAIN,
          payload: chainId,
        });
      }
    }
  }, [chainId, previousChainId, config]);

  const setTokenSymbol = useCallback((tokenSymbol: string) => {
    dispatch({
      type: ActionType.SET_TOKEN,
      payload: tokenSymbol,
    });
  }, []);
  const setAmount = useCallback((amount: ethers.BigNumber) => {
    dispatch({
      type: ActionType.SET_AMOUNT,
      payload: amount,
    });
  }, []);
  const setToChain = useCallback((toChain: ChainId) => {
    dispatch({
      type: ActionType.SET_TO_CHAIN,
      payload: toChain,
    });
  }, []);
  const setFromChain = useCallback((fromChain: ChainId) => {
    dispatch({
      type: ActionType.SET_FROM_CHAIN,
      payload: fromChain,
    });
  }, []);
  const setToAddress = useCallback((toAddress: string) => {
    dispatch({
      type: ActionType.SET_TO_ADDRESS,
      payload: toAddress,
    });
  }, []);
  const setError = useCallback((error: ParsingError | undefined) => {
    dispatch({
      type: ActionType.SET_ERROR,
      payload: error,
    });
  }, []);

  return {
    ...state,
    setTokenSymbol,
    setAmount,
    setToChain,
    setFromChain,
    setToAddress,
    setError,
  };
}
const SendFormContext = createContext<SendFormManagerContext | undefined>(
  undefined
);
SendFormContext.displayName = "SendFormContext";
/**
 * Context provider for the send form. This is used to share the state of the form between components.
 * @param props  React props, only accepting `children`
 */
export const SendFormProvider: React.FC = ({ children }) => {
  const state = useSendFormManager();

  return (
    <SendFormContext.Provider value={state}>
      {children}
    </SendFormContext.Provider>
  );
};
/**
 * This hook is used to manage the send form state. It returns the current state of the form, along with setters for the form.
 * @remarks This hook must be used within the {@link SendFormProvider} component.
 * @returns Returns a {@link SendFormManagerContext} object
 */
export function useSendForm() {
  const context = useContext(SendFormContext);
  if (!context) {
    throw new Error("UseSendForm must be used within a <SendFormProvider>");
  }
  return context;
}
