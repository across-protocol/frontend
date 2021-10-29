import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchPoolState,
  fetchUserPoolData,
  FetchUserPoolDataResponse,
} from "./poolsApi";

export const getPoolState = createAsyncThunk(
  "pools/getPoolState",
  async (address: string) => {
    const response = (await fetchPoolState(address)) as Pool;
    // The value we return becomes the `fulfilled` action payload
    return response;
  }
);

export const getUserPoolState = createAsyncThunk(
  "pools/getUserPoolData",
  async ({
    account,
    poolAddress,
  }: {
    account: string;
    poolAddress: string;
  }) => {
    const response = (await fetchUserPoolData(
      account,
      poolAddress
    )) as FetchUserPoolDataResponse;
    // The value we return becomes the `fulfilled` action payload

    return {
      pool: response.pool,
      user: { ...response.user, poolAddress: response.pool.address },
    };
  }
);

/* 
From Docs:
  PoolState: {
    address: "0x75a29a66452C80702952bbcEDd284C8c4CF5Ab17"
    estimatedApy: "0.0014610627461143652"
    exchangeRateCurrent: "1000002229851888803"
    exchangeRatePrevious: "1000002229222859216"
    l1Token: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    totalPoolSize: "14626089757879757436"
  }
*/

export interface Pool {
  address: string;
  estimatedApy: string;
  exchangeRateCurrent: string;
  exchangeRatePrevious: string;
  l1Token: string;
  totalPoolSize: string;
}

export interface Pools {
  [address: string]: Pool;
}

//  user: {
//    address: '0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D',
//    lpTokens: '900000000000000000',
//    positionValue: '900000541941830509',
//    totalDeposited: '900000000000000000',
//    feesEarned: '541941830509'
//  },

export interface UserPoolData {
  address: string;
  lpTokens: string;
  positionValue: string;
  totalDeposited: string;
  feesEarned: string;
  poolAddress: string;
}

export interface UserPoolsData {
  [poolAddress: string]: UserPoolData;
}

interface UserData {
  [account: string]: {
    userPoolsData: UserPoolsData;
  };
}

interface State {
  pools: Pools;
  userData: UserData;
  error?: Error;
}

const initialState: State = {
  pools: {} as Pools,
  userData: {} as UserData,
  error: undefined,
};

const poolsSlice = createSlice({
  name: "pools",
  initialState,
  reducers: {
    // pools: (state, action: PayloadAction<Pools>) => {
    //   state.pools = {...action.payload};
    //   return state;
    // },
    error: (state, action: PayloadAction<Pick<State, "error">>) => {
      state.error = action.payload.error;
      return state;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(getPoolState.fulfilled, (state, action) => {
        const modData = {
          ...action.payload,
          address: action.payload.address.toLowerCase(),
        };

        state.pools[action.payload.address] = modData;
        // state.pools[action.payload.address] = action.payload;

        return state;
      })
      .addCase(getUserPoolState.fulfilled, (state, action) => {
        const userAddress = action.payload.user.address;

        if (Object.keys(state.userData).length && state.userData[userAddress]) {
          const nextState = {
            ...state.userData[userAddress].userPoolsData,
            [action.payload.pool.address]: action.payload.user,
          };

          state.userData[userAddress].userPoolsData = nextState;
        } else if (
          Object.keys(state.userData).length &&
          !state.userData[userAddress]
        ) {
          const nextState = {
            userPoolsData: {
              [action.payload.pool.address]: action.payload.user,
            },
          };
          state.userData[userAddress] = nextState;
        } else {
          state.userData[userAddress] = {
            userPoolsData: {
              [action.payload.pool.address]: action.payload.user,
            },
          };
        }

        return state;
      }),
});

const { actions, reducer } = poolsSlice;
// Extract and export each action creator by name
export const { error } = actions;
// Export the reducer, either as a default or named export
export default reducer;
