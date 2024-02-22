import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    userId: "demoUser",
  },
  reducers: {
    logInUser(state, action) {
      state.userId = action.payload;
    },
  },
});

export default authSlice.reducer;
