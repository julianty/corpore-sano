import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    userId: "demoUser",
    displayName: "Demo User",
  },
  reducers: {
    logInUser(state, action) {
      state.userId = action.payload.uid;
      state.displayName = action.payload.displayName;
    },
    logOutUser(state) {
      state.userId = "demoUser";
      state.displayName = "Demo User";
    },
  },
});

export default authSlice.reducer;
