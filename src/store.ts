import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import exercisesReducer from "./features/exercises/exercisesSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    exercises: exercisesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
