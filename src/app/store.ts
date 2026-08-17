import { configureStore } from '@reduxjs/toolkit';
import learnersReducer from '../features/learners/learnersSlice';

const store = configureStore({
  reducer: {
    learners: learnersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;