import { apiService } from './api';
import { FallEvent, FallStats, CreateFallEventDto } from '../types';

export const fallDetectionService = {
    async getFallEvents(): Promise<FallEvent[]> {
        return apiService.get<FallEvent[]>('/fall-detection/events');
    },

    async getFallEvent(id: string): Promise<FallEvent> {
        return apiService.get<FallEvent>(`/fall-detection/events/${id}`);
    },

    async acknowledgeFallEvent(id: string, isFalseAlarm: boolean, falseAlarmReason?: string): Promise<FallEvent> {
        return apiService.post<FallEvent>(`/fall-detection/events/${id}/acknowledge`, {
            isFalseAlarm,
            falseAlarmReason,
        });
    },

    async getStats(days: number = 30): Promise<FallStats> {
        return apiService.get<FallStats>(`/fall-detection/stats?days=${days}`);
    },

    async createFallEvent(data: CreateFallEventDto): Promise<FallEvent> {
        return apiService.post<FallEvent>('/fall-detection/events', data);
    },
};