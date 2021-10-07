import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";

import selectedSendArgsReducer from "./selectedSendArgs";
import connectionReducer from "./connection";
import globalReducer from "./global";
import transfersReducer from "./transfers";
import chainApi from "./chain";

export const store = configureStore({
  reducer: {
    selectedSendArgs: selectedSendArgsReducer,
    connection: connectionReducer,
    global: globalReducer,
    transfers: transfersReducer,
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
