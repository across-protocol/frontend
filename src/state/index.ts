import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";

import selectAddressReducer from "./selectedAddress";
import connectionReducer from "./connection";
import globalReducer from "./global";
import chainApi from "./chain";

export const store = configureStore({
  reducer: {
    selectedAddress: selectAddressReducer,
    connection: connectionReducer,
    global: globalReducer,
    [chainApi.reducerPath]: chainApi.reducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleWare) =>
    getDefaultMiddleWare({ serializableCheck: false }).concat(
      chainApi.middleware
    ),
});

setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
