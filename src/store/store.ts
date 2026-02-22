// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import userReducer from "./userSlice";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    user: userReducer,
    // add other reducers here in future
  },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
