import { configureStore } from '@reduxjs/toolkit'
import taskReducer from './slices/taskSlice';
import videoReducer from './slices/videoSlice';

export const store = configureStore({
  reducer: {
    tasks: taskReducer,
    videos: videoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;