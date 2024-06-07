import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ExercisesState {
  favoriteExercises: string[];
}

const exercisesSlice = createSlice({
  name: "exercises",
  initialState: { favoriteExercises: [] } as ExercisesState,
  reducers: {
    setFavoriteExercises: (state, action: PayloadAction<string[]>) => {
      state.favoriteExercises = action.payload;
    },
    addFavoriteExercise: (state, action: PayloadAction<string>) => {
      state.favoriteExercises.push(action.payload);
    },
    removeFavoriteExercise: (state, action: PayloadAction<string>) => {
      state.favoriteExercises = state.favoriteExercises.filter(
        (exercise) => exercise !== action.payload
      );
    },
  },
});

export const {
  setFavoriteExercises,
  addFavoriteExercise,
  removeFavoriteExercise,
} = exercisesSlice.actions;

export default exercisesSlice.reducer;
