import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FallEvent, FallStats } from '../types';
import { fallDetectionService } from '../services/fall-detection.service';

interface FallDetectionState {
    events: FallEvent[];
    stats: FallStats | null;
    loading: boolean;
    error: string | null;
    selectedEvent: FallEvent | null;
}

const initialState: FallDetectionState = {
    events: [],
    stats: null,
    loading: false,
    error: null,
    selectedEvent: null,
};

export const fetchFallEvents = createAsyncThunk(
    'fallDetection/fetchFallEvents',
    async () => {
        const events = await fallDetectionService.getFallEvents();
        return events;
    }
);

export const fetchFallStats = createAsyncThunk(
    'fallDetection/fetchFallStats',
    async (days: number = 30) => {
        const stats = await fallDetectionService.getStats(days);
        return stats;
    }
);

export const acknowledgeFallEvent = createAsyncThunk(
    'fallDetection/acknowledgeFallEvent',
    async ({ id, isFalseAlarm, falseAlarmReason }: { id: string; isFalseAlarm: boolean; falseAlarmReason?: string }) => {
        const event = await fallDetectionService.acknowledgeFallEvent(id, isFalseAlarm, falseAlarmReason);
        return event;
    }
);

const fallDetectionSlice = createSlice({
    name: 'fallDetection',
    initialState,
    reducers: {
        setSelectedEvent: (state, action: PayloadAction<FallEvent | null>) => {
            state.selectedEvent = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFallEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFallEvents.fulfilled, (state, action: PayloadAction<FallEvent[]>) => {
                state.loading = false;
                state.events = action.payload;
            })
            .addCase(fetchFallEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch fall events';
            })
            .addCase(fetchFallStats.fulfilled, (state, action: PayloadAction<FallStats>) => {
                state.stats = action.payload;
            })
            .addCase(acknowledgeFallEvent.fulfilled, (state, action: PayloadAction<FallEvent>) => {
                const index = state.events.findIndex(event => event._id === action.payload._id);
                if (index !== -1) {
                    state.events[index] = action.payload;
                }
                if (state.selectedEvent && state.selectedEvent._id === action.payload._id) {
                    state.selectedEvent = action.payload;
                }
            });
    },
});

export const { setSelectedEvent, clearError } = fallDetectionSlice.actions;
export default fallDetectionSlice.reducer;