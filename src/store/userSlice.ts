// src/store/uiSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserState = {
  currency: string;
  companyId: string;
  role: string;
};

const initialState: UserState = {
  currency: "",
  companyId: "",
  role: ",",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrency(state, action: PayloadAction<string>) {
      state.currency = action.payload;
    },
  },
});

export const { setCurrency } = userSlice.actions;
export default userSlice.reducer;
