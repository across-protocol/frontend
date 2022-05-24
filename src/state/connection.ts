import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { hubPoolChainId } from "utils";
import {
  ChainId,
  UnsupportedChainIdError,
  isSupportedChainId,
  getAddress,
} from "utils";
import Notify, { API as NotifyAPI } from "bnc-notify";

type State = {
  account?: string;
  ensName?: string;
  chainId?: ChainId;
  provider?: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
  error?: Error;
  notify: NotifyAPI;
};

export type Update = Omit<State, "error" | "chainId" | "notify"> & {
  chainId?: number;
};
type ErrorUpdate = Required<Pick<State, "error">>;

const initialState: State = {
  notify: Notify({
    dappId: process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY, // [String] The API key created by step one above
    networkId: hubPoolChainId,
    desktopPosition: "topRight",
  }),
};

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    update: (state, action: PayloadAction<Update>) => {
      const { account, ensName, chainId, provider, signer } = action.payload;
      state.account = account ? getAddress(account) : state.account;
      state.ensName = ensName
      state.provider = provider ?? state.provider;
      // theres a potential problem with this: if onboard says a signer is undefined, we default them back
      // to the previous signer. This means we get out of sync with onboard and could have serious consequences.
      state.signer = signer ?? state.signer;
      if (chainId) {
        if (isSupportedChainId(chainId)) {
          state.chainId = chainId;
          if (state.error instanceof UnsupportedChainIdError) {
            state.error = undefined;
          }
        } else {
          state.error = new UnsupportedChainIdError(chainId);
        }
      }
      return state;
    },
    error: (state, action: PayloadAction<ErrorUpdate>) => {
      state.error = action.payload.error;
      return state;
    },
    disconnect: (state) => {
      state = initialState;
      return state;
    },
  },
});

const { actions, reducer } = connectionSlice;
// Extract and export each action creator by name
export const { update, disconnect, error } = actions;
// Export the reducer, either as a default or named export
export default reducer;
