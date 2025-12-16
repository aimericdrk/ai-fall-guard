import { apiService } from './api';
import { Notification } from '../types';

export const notificationService = {
    async getNotifications(): Promise<Notification[]> {
        return apiService.get<Notification[]>('/notifications');
    },

    async getUnreadCount(): Promise<{ count: number }> {
        return apiService.get<{ count: number }>('/notifications/unread-count');
    },

    async acknowledgeNotification(id: string): Promise<Notification> {
        return apiService.post<Notification>(`/notifications/${id}/acknowledge`);
    },

    async markAsRead(id: string): Promise<Notification> {
        return apiService.post<Notification>(`/notifications/${id}/read`);
    },

    async createFallNotification(data: any): Promise<Notification> {
        return apiService.post<Notification>('/notifications/fall-detected', data);
    },
};