import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import fallDetectionReducer from './fallDetectionSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        fallDetection: fallDetectionReducer,
        notifications: notificationReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;