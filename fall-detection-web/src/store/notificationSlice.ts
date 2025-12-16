import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../types';
import { notificationService } from '../services/notification.service';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async () => {
        const notifications = await notificationService.getNotifications();
        return notifications;
    }
);

export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async () => {
        const response = await notificationService.getUnreadCount();
        return response.count;
    }
);

export const acknowledgeNotification = createAsyncThunk(
    'notifications/acknowledgeNotification',
    async (id: string) => {
        const notification = await notificationService.acknowledgeNotification(id);
        return notification;
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (id: string) => {
        const notification = await notificationService.markAsRead(id);
        return notification;
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        decrementUnreadCount: (state) => {
            if (state.unreadCount > 0) {
                state.unreadCount -= 1;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
                state.loading = false;
                state.notifications = action.payload;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch notifications';
            })
            .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
                state.unreadCount = action.payload;
            })
            .addCase(acknowledgeNotification.fulfilled, (state, action: PayloadAction<Notification>) => {
                const index = state.notifications.findIndex(n => n._id === action.payload._id);
                if (index !== -1) {
                    state.notifications[index] = action.payload;
                }
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            })
            .addCase(markAsRead.fulfilled, (state, action: PayloadAction<Notification>) => {
                const index = state.notifications.findIndex(n => n._id === action.payload._id);
                if (index !== -1) {
                    state.notifications[index] = action.payload;
                }
            });
    },
});

export const { clearError, decrementUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;